import { pgTable, uuid, text, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations, planEnum } from './organizations'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
])

export const billingCycleEnum = pgEnum('billing_cycle', ['monthly', 'yearly'])

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'open',
  'paid',
  'void',
  'uncollectible',
])

// ─── Subscriptions ───────────────────────────────────────────────────────────

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePriceId: text('stripe_price_id'),
  plan: planEnum('plan').notNull().default('free'),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  billingCycle: billingCycleEnum('billing_cycle').notNull().default('monthly'),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  canceledAt: timestamp('canceled_at', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  cancelReason: text('cancel_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Invoices ────────────────────────────────────────────────────────────────

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  stripeInvoiceId: text('stripe_invoice_id').unique().notNull(),
  amountDue: integer('amount_due').notNull(),
  amountPaid: integer('amount_paid').notNull().default(0),
  currency: text('currency').notNull().default('brl'),
  status: invoiceStatusEnum('status').notNull(),
  invoiceUrl: text('invoice_url'),
  pdfUrl: text('pdf_url'),
  periodStart: timestamp('period_start', { withTimezone: true }),
  periodEnd: timestamp('period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Plan Limits ─────────────────────────────────────────────────────────────

export const planLimits = pgTable('plan_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  plan: planEnum('plan').unique().notNull(),
  maxFunnels: integer('max_funnels').notNull(),
  maxIntegrations: integer('max_integrations').notNull(),
  maxMembers: integer('max_members').notNull(),
  syncIntervalMinutes: integer('sync_interval_minutes').notNull(),
  historyRetentionDays: integer('history_retention_days').notNull(),
  hasExport: boolean('has_export').notNull().default(false),
  hasAlerts: boolean('has_alerts').notNull().default(false),
  hasComparison: boolean('has_comparison').notNull().default(false),
  hasPublicLink: boolean('has_public_link').notNull().default(false),
  hasComments: boolean('has_comments').notNull().default(false),
  hasBenchmarks: boolean('has_benchmarks').notNull().default(false),
  hasApi: boolean('has_api').notNull().default(false),
  hasSso: boolean('has_sso').notNull().default(false),
  hasWhiteLabel: boolean('has_white_label').notNull().default(false),
})

// ─── Relations ───────────────────────────────────────────────────────────────

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id],
  }),
}))

export const invoicesRelations = relations(invoices, ({ one }) => ({
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
}))
