import { type NextRequest, NextResponse } from 'next/server'
import { db, eq, and } from '@funnlio/db'
import { subscriptions, invoices, organizations } from '@funnlio/db'
import crypto from 'node:crypto'

// ─── Stripe Price ID → Plan mapping ────────────────────────────────────────────

type Plan = 'starter' | 'pro' | 'enterprise'
type BillingCycle = 'monthly' | 'yearly'

interface PlanInfo {
  plan: Plan
  billingCycle: BillingCycle
}

function getPlanFromPriceId(priceId: string): PlanInfo | null {
  const priceMap: Record<string, PlanInfo> = {}

  const mappings: Array<{ env: string; plan: Plan; billingCycle: BillingCycle }> = [
    { env: 'STRIPE_PRICE_STARTER_MONTHLY', plan: 'starter', billingCycle: 'monthly' },
    { env: 'STRIPE_PRICE_STARTER_YEARLY', plan: 'starter', billingCycle: 'yearly' },
    { env: 'STRIPE_PRICE_PRO_MONTHLY', plan: 'pro', billingCycle: 'monthly' },
    { env: 'STRIPE_PRICE_PRO_YEARLY', plan: 'pro', billingCycle: 'yearly' },
    { env: 'STRIPE_PRICE_ENTERPRISE_MONTHLY', plan: 'enterprise', billingCycle: 'monthly' },
    { env: 'STRIPE_PRICE_ENTERPRISE_YEARLY', plan: 'enterprise', billingCycle: 'yearly' },
  ]

  for (const { env, plan, billingCycle } of mappings) {
    const id = process.env[env]
    if (id) {
      priceMap[id] = { plan, billingCycle }
    }
  }

  return priceMap[priceId] ?? null
}

// ─── Stripe webhook signature verification ──────────────────────────────────────

function verifyStripeSignature(payload: string, signature: string, secret: string): boolean {
  const elements = signature.split(',')
  const timestamp = elements.find((e) => e.startsWith('t='))?.slice(2)
  const v1Signature = elements.find((e) => e.startsWith('v1='))?.slice(3)

  if (!timestamp || !v1Signature) return false

  // Reject timestamps older than 5 minutes to prevent replay attacks
  const timestampSeconds = parseInt(timestamp, 10)
  const currentSeconds = Math.floor(Date.now() / 1000)
  if (Math.abs(currentSeconds - timestampSeconds) > 300) return false

  const signedPayload = `${timestamp}.${payload}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(v1Signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    )
  } catch {
    return false
  }
}

// ─── Event handlers ─────────────────────────────────────────────────────────────

async function handleCheckoutSessionCompleted(data: Record<string, unknown>): Promise<void> {
  const customerId = data.customer as string
  const subscriptionId = data.subscription as string
  const metadata = data.metadata as Record<string, string> | null

  if (!metadata?.organizationId) {
    console.error('[stripe-webhook] checkout.session.completed missing organizationId in metadata')
    return
  }

  const organizationId = metadata.organizationId

  // Check if subscription record already exists (created by subscription.created event)
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
    .limit(1)

  if (existing.length > 0) {
    // Update with organizationId if not already set
    await db
      .update(subscriptions)
      .set({
        organizationId,
        stripeCustomerId: customerId,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
  } else {
    // Create subscription record - details will be filled by subscription.created/updated
    await db.insert(subscriptions).values({
      organizationId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      plan: 'starter',
      status: 'active',
    })
  }
}

async function handleSubscriptionCreated(data: Record<string, unknown>): Promise<void> {
  const subscriptionId = data.id as string
  const customerId = data.customer as string
  const status = data.status as string
  const currentPeriodStart = data.current_period_start as number
  const currentPeriodEnd = data.current_period_end as number
  const trialEnd = data.trial_end as number | null
  const cancelAtPeriodEnd = (data.cancel_at_period_end as boolean) ?? false

  const items = data.items as { data: Array<{ price: { id: string } }> }
  const priceId = items?.data?.[0]?.price?.id
  const planInfo = priceId ? getPlanFromPriceId(priceId) : null

  // Find org by existing subscription or by Stripe customer ID
  const existingSub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1)

  const organizationId = existingSub[0]?.organizationId

  if (!organizationId) {
    // Subscription will be linked when checkout.session.completed arrives with metadata
    console.warn('[stripe-webhook] subscription.created: no org found for customer', customerId)
    return
  }

  const mappedStatus = mapSubscriptionStatus(status)

  // Upsert subscription
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
    .limit(1)

  const values = {
    organizationId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: priceId ?? null,
    plan: planInfo?.plan ?? 'starter',
    status: mappedStatus,
    billingCycle: planInfo?.billingCycle ?? 'monthly',
    currentPeriodStart: new Date(currentPeriodStart * 1000),
    currentPeriodEnd: new Date(currentPeriodEnd * 1000),
    trialEndsAt: trialEnd ? new Date(trialEnd * 1000) : null,
    cancelAtPeriodEnd,
    updatedAt: new Date(),
  } as const

  if (existing.length > 0) {
    await db
      .update(subscriptions)
      .set(values)
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
  } else {
    await db.insert(subscriptions).values(values)
  }

  // Sync plan to organization
  if (planInfo) {
    await db
      .update(organizations)
      .set({ plan: planInfo.plan, updatedAt: new Date() })
      .where(eq(organizations.id, organizationId))
  }
}

async function handleSubscriptionUpdated(data: Record<string, unknown>): Promise<void> {
  const subscriptionId = data.id as string
  const status = data.status as string
  const currentPeriodStart = data.current_period_start as number
  const currentPeriodEnd = data.current_period_end as number
  const trialEnd = data.trial_end as number | null
  const cancelAtPeriodEnd = (data.cancel_at_period_end as boolean) ?? false
  const canceledAt = data.canceled_at as number | null

  const items = data.items as { data: Array<{ price: { id: string } }> }
  const priceId = items?.data?.[0]?.price?.id
  const planInfo = priceId ? getPlanFromPriceId(priceId) : null

  const mappedStatus = mapSubscriptionStatus(status)

  const updateValues: Record<string, unknown> = {
    status: mappedStatus,
    currentPeriodStart: new Date(currentPeriodStart * 1000),
    currentPeriodEnd: new Date(currentPeriodEnd * 1000),
    trialEndsAt: trialEnd ? new Date(trialEnd * 1000) : null,
    cancelAtPeriodEnd,
    canceledAt: canceledAt ? new Date(canceledAt * 1000) : null,
    updatedAt: new Date(),
  }

  if (priceId) {
    updateValues.stripePriceId = priceId
  }
  if (planInfo) {
    updateValues.plan = planInfo.plan
    updateValues.billingCycle = planInfo.billingCycle
  }

  await db
    .update(subscriptions)
    .set(updateValues)
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))

  // Sync plan to organization
  if (planInfo) {
    const sub = await db
      .select({ organizationId: subscriptions.organizationId })
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
      .limit(1)

    if (sub[0]) {
      await db
        .update(organizations)
        .set({ plan: planInfo.plan, updatedAt: new Date() })
        .where(eq(organizations.id, sub[0].organizationId))
    }
  }
}

async function handleSubscriptionDeleted(data: Record<string, unknown>): Promise<void> {
  const subscriptionId = data.id as string
  const canceledAt = data.canceled_at as number | null

  // Find the subscription to get the org
  const sub = await db
    .select({ organizationId: subscriptions.organizationId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
    .limit(1)

  // Mark subscription as canceled
  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      canceledAt: canceledAt ? new Date(canceledAt * 1000) : new Date(),
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))

  // Downgrade organization to trial (free tier)
  if (sub[0]) {
    await db
      .update(organizations)
      .set({ plan: 'trial', updatedAt: new Date() })
      .where(eq(organizations.id, sub[0].organizationId))
  }
}

async function handleInvoicePaid(data: Record<string, unknown>): Promise<void> {
  const stripeInvoiceId = data.id as string
  const customerId = data.customer as string
  const amountDue = (data.amount_due as number) ?? 0
  const amountPaid = (data.amount_paid as number) ?? 0
  const currency = (data.currency as string) ?? 'brl'
  const invoiceUrl = data.hosted_invoice_url as string | null
  const pdfUrl = data.invoice_pdf as string | null
  const periodStart = data.period_start as number | null
  const periodEnd = data.period_end as number | null

  // Find organization from subscription
  const sub = await db
    .select({ organizationId: subscriptions.organizationId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1)

  if (!sub[0]) {
    console.warn('[stripe-webhook] invoice.paid: no subscription found for customer', customerId)
    return
  }

  // Upsert invoice
  const existing = await db
    .select()
    .from(invoices)
    .where(eq(invoices.stripeInvoiceId, stripeInvoiceId))
    .limit(1)

  const values = {
    organizationId: sub[0].organizationId,
    stripeInvoiceId,
    amountDue,
    amountPaid,
    currency,
    status: 'paid' as const,
    invoiceUrl,
    pdfUrl,
    periodStart: periodStart ? new Date(periodStart * 1000) : null,
    periodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
  }

  if (existing.length > 0) {
    await db
      .update(invoices)
      .set(values)
      .where(eq(invoices.stripeInvoiceId, stripeInvoiceId))
  } else {
    await db.insert(invoices).values(values)
  }

  // Ensure subscription stays active
  await db
    .update(subscriptions)
    .set({ status: 'active', updatedAt: new Date() })
    .where(
      and(
        eq(subscriptions.stripeCustomerId, customerId),
        eq(subscriptions.status, 'past_due'),
      ),
    )
}

async function handleInvoicePaymentFailed(data: Record<string, unknown>): Promise<void> {
  const stripeInvoiceId = data.id as string
  const customerId = data.customer as string
  const amountDue = (data.amount_due as number) ?? 0
  const amountPaid = (data.amount_paid as number) ?? 0
  const currency = (data.currency as string) ?? 'brl'
  const invoiceUrl = data.hosted_invoice_url as string | null
  const pdfUrl = data.invoice_pdf as string | null
  const periodStart = data.period_start as number | null
  const periodEnd = data.period_end as number | null

  // Find organization from subscription
  const sub = await db
    .select({ organizationId: subscriptions.organizationId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1)

  if (!sub[0]) {
    console.warn('[stripe-webhook] invoice.payment_failed: no subscription found for customer', customerId)
    return
  }

  // Register the failed invoice
  const existing = await db
    .select()
    .from(invoices)
    .where(eq(invoices.stripeInvoiceId, stripeInvoiceId))
    .limit(1)

  const values = {
    organizationId: sub[0].organizationId,
    stripeInvoiceId,
    amountDue,
    amountPaid,
    currency,
    status: 'open' as const,
    invoiceUrl,
    pdfUrl,
    periodStart: periodStart ? new Date(periodStart * 1000) : null,
    periodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
  }

  if (existing.length > 0) {
    await db
      .update(invoices)
      .set(values)
      .where(eq(invoices.stripeInvoiceId, stripeInvoiceId))
  } else {
    await db.insert(invoices).values(values)
  }

  // Mark subscription as past_due
  await db
    .update(subscriptions)
    .set({ status: 'past_due', updatedAt: new Date() })
    .where(eq(subscriptions.stripeCustomerId, customerId))

  // TODO: Send payment failed notification email to org owner
  console.warn('[stripe-webhook] Payment failed for customer', customerId, '- marked as past_due')
}

async function handleTrialWillEnd(data: Record<string, unknown>): Promise<void> {
  const subscriptionId = data.id as string
  const trialEnd = data.trial_end as number | null

  if (trialEnd) {
    await db
      .update(subscriptions)
      .set({
        trialEndsAt: new Date(trialEnd * 1000),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
  }

  // TODO: Trigger trial ending email sequence
  console.info('[stripe-webhook] Trial ending soon for subscription', subscriptionId)
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete'

function mapSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
    paused: 'canceled',
  }
  return statusMap[stripeStatus] ?? 'active'
}

// ─── Route handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const isValid = verifyStripeSignature(body, signature, webhookSecret)
  if (!isValid) {
    console.error('[stripe-webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: { type: string; data: { object: Record<string, unknown> } }
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const { type, data } = event

  try {
    switch (type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(data.object)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(data.object)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(data.object)
        break

      case 'invoice.paid':
        await handleInvoicePaid(data.object)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(data.object)
        break

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(data.object)
        break

      default:
        console.info('[stripe-webhook] Unhandled event type:', type)
    }
  } catch (error) {
    console.error(`[stripe-webhook] Error handling ${type}:`, error)
    // Return 200 to prevent Stripe from retrying indefinitely for logic errors.
    // Stripe will retry on 4xx/5xx, so only return error status for transient failures.
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
