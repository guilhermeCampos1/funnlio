import { TRPCError, router, protectedProcedure, ownerAdminProcedure, z } from '../trpc.js'
import {
  subscriptions,
  invoices,
  organizations,
  funnels,
  integrations,
  organizationMembers,
  eq,
  and,
  desc,
  sql,
} from '@funnlio/db'
import { PLAN_LIMITS, getEffectivePlanLimits } from '@funnlio/shared'

// ─── Stripe helpers ─────────────────────────────────────────────────────────

const STRIPE_API = 'https://api.stripe.com/v1'

function getStripeKey(): string {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Stripe não está configurado. Configure STRIPE_SECRET_KEY.',
    })
  }
  return key
}

async function stripeRequest<T>(
  path: string,
  options: { method?: string; body?: Record<string, string> } = {}
): Promise<T> {
  const { method = 'GET', body } = options
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getStripeKey()}`,
  }

  const init: RequestInit = { method, headers }

  if (body) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    init.body = new URLSearchParams(body).toString()
  }

  const res = await fetch(`${STRIPE_API}${path}`, init)

  if (!res.ok) {
    const error = (await res.json()) as { error?: { message?: string } }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Stripe error: ${error.error?.message ?? res.statusText}`,
    })
  }

  return res.json() as T
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isTrialExpired(org: { plan: string; planExpiresAt: Date | null }): boolean {
  if (org.plan !== 'trial') return false
  if (!org.planExpiresAt) return false
  return new Date() > org.planExpiresAt
}

// ─── Router ─────────────────────────────────────────────────────────────────

export const billingRouter = router({
  // ─── Get current subscription for the org ───────────────────────────────
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const { organizationId } = ctx.session

    const org = await ctx.db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    })

    if (!org) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Organização não encontrada' })
    }

    const subscription = await ctx.db.query.subscriptions.findFirst({
      where: eq(subscriptions.organizationId, organizationId),
    })

    const trialExpired = isTrialExpired(org)

    return {
      subscription: subscription ?? null,
      plan: org.plan,
      trialExpired,
      planExpiresAt: org.planExpiresAt,
    }
  }),

  // ─── Get plan limits for current org ────────────────────────────────────
  getPlanLimits: protectedProcedure.query(async ({ ctx }) => {
    const { organizationId } = ctx.session

    const org = await ctx.db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    })

    if (!org) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Organização não encontrada' })
    }

    const trialExpired = isTrialExpired(org)
    const limits = getEffectivePlanLimits(org.plan, trialExpired)

    return {
      plan: org.plan,
      trialExpired,
      limits,
    }
  }),

  // ─── Get current usage vs limits ────────────────────────────────────────
  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const { organizationId } = ctx.session

    const org = await ctx.db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    })

    if (!org) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Organização não encontrada' })
    }

    const trialExpired = isTrialExpired(org)
    const limits = getEffectivePlanLimits(org.plan, trialExpired)

    // Count resources in parallel
    const [funnelCount, integrationCount, memberCount] = await Promise.all([
      ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(funnels)
        .where(eq(funnels.organizationId, organizationId))
        .then((rows) => Number(rows[0]?.count ?? 0)),
      ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(integrations)
        .where(eq(integrations.organizationId, organizationId))
        .then((rows) => Number(rows[0]?.count ?? 0)),
      ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, organizationId))
        .then((rows) => Number(rows[0]?.count ?? 0)),
    ])

    return {
      plan: org.plan,
      trialExpired,
      funnels: { current: funnelCount, limit: limits.maxFunnels },
      integrations: { current: integrationCount, limit: limits.maxIntegrations },
      members: { current: memberCount, limit: limits.maxMembers },
    }
  }),

  // ─── Create Stripe Checkout Session for upgrade ─────────────────────────
  createCheckout: ownerAdminProcedure
    .input(
      z.object({
        plan: z.enum(['starter', 'pro', 'enterprise']),
        billingCycle: z.enum(['monthly', 'yearly']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      const org = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
      })

      if (!org) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Organização não encontrada' })
      }

      // Check if org already has a Stripe customer
      const existingSub = await ctx.db.query.subscriptions.findFirst({
        where: eq(subscriptions.organizationId, organizationId),
      })

      let stripeCustomerId = existingSub?.stripeCustomerId

      // Create Stripe customer if none exists
      if (!stripeCustomerId) {
        const customer = await stripeRequest<{ id: string }>('/customers', {
          method: 'POST',
          body: {
            name: org.name,
            'metadata[organizationId]': organizationId,
          },
        })
        stripeCustomerId = customer.id
      }

      // Price IDs must be configured in Stripe Dashboard and set as env vars
      // Format: STRIPE_PRICE_{PLAN}_{CYCLE} e.g. STRIPE_PRICE_PRO_MONTHLY
      const priceEnvKey = `STRIPE_PRICE_${input.plan.toUpperCase()}_${input.billingCycle.toUpperCase()}`
      const priceId = process.env[priceEnvKey]

      if (!priceId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Preço não configurado para ${input.plan}/${input.billingCycle}. Configure ${priceEnvKey}.`,
        })
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

      const session = await stripeRequest<{ id: string; url: string }>(
        '/checkout/sessions',
        {
          method: 'POST',
          body: {
            customer: stripeCustomerId,
            mode: 'subscription',
            'line_items[0][price]': priceId,
            'line_items[0][quantity]': '1',
            success_url: `${appUrl}/settings/billing?success=true`,
            cancel_url: `${appUrl}/settings/billing?canceled=true`,
            'subscription_data[metadata][organizationId]': organizationId,
            'subscription_data[metadata][plan]': input.plan,
          },
        }
      )

      return { checkoutUrl: session.url }
    }),

  // ─── Create Stripe Customer Portal session ─────────────────────────────
  createPortalSession: ownerAdminProcedure.mutation(async ({ ctx }) => {
    const { organizationId } = ctx.session

    const subscription = await ctx.db.query.subscriptions.findFirst({
      where: eq(subscriptions.organizationId, organizationId),
    })

    if (!subscription?.stripeCustomerId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Nenhuma assinatura encontrada. Faça upgrade primeiro.',
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const portalSession = await stripeRequest<{ url: string }>(
      '/billing_portal/sessions',
      {
        method: 'POST',
        body: {
          customer: subscription.stripeCustomerId,
          return_url: `${appUrl}/settings/billing`,
        },
      }
    )

    return { portalUrl: portalSession.url }
  }),

  // ─── Get invoices for the org ───────────────────────────────────────────
  getInvoices: protectedProcedure.query(async ({ ctx }) => {
    const { organizationId } = ctx.session

    const rows = await ctx.db.query.invoices.findMany({
      where: eq(invoices.organizationId, organizationId),
      orderBy: desc(invoices.createdAt),
    })

    return rows
  }),

  // ─── Cancel subscription (3-step flow) ──────────────────────────────────
  cancelSubscription: ownerAdminProcedure
    .input(
      z.object({
        reason: z.string().optional(),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      const subscription = await ctx.db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.organizationId, organizationId),
          eq(subscriptions.status, 'active')
        ),
      })

      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Nenhuma assinatura ativa encontrada.',
        })
      }

      // Cancel at period end on Stripe (not immediately)
      if (subscription.stripeSubscriptionId) {
        await stripeRequest(`/subscriptions/${subscription.stripeSubscriptionId}`, {
          method: 'POST',
          body: {
            cancel_at_period_end: 'true',
            'cancellation_details[comment]': input.feedback ?? '',
          },
        })
      }

      // Update local record
      await ctx.db
        .update(subscriptions)
        .set({
          cancelAtPeriodEnd: true,
          cancelReason: input.reason ?? null,
          canceledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id))

      return {
        success: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: subscription.currentPeriodEnd,
      }
    }),
})
