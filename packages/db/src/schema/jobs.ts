import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations } from './organizations'
import { integrations } from './integrations'
import { funnelStages } from './funnels'

export const syncJobStatusEnum = pgEnum('sync_job_status', [
  'queued',
  'running',
  'success',
  'failed',
  'cancelled',
])

export const syncTriggerEnum = pgEnum('sync_trigger', ['scheduled', 'manual', 'webhook'])

// ─── Sync Jobs ────────────────────────────────────────────────────────────────

export const syncJobs = pgTable('sync_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  integrationId: uuid('integration_id').references(() => integrations.id, {
    onDelete: 'set null',
  }),
  stageId: uuid('stage_id').references(() => funnelStages.id, { onDelete: 'set null' }),
  status: syncJobStatusEnum('status').notNull().default('queued'),
  trigger: syncTriggerEnum('trigger').notNull().default('scheduled'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  error: text('error'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Admin: Usage Events ──────────────────────────────────────────────────────

export const usageEvents = pgTable('usage_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(), // 'api_call', 'funnel_created', 'sync_completed'
  quantity: text('quantity').notNull().default('1'),
  metadata: jsonb('metadata').notNull().default({}),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Admin: Monthly Usage Summary ─────────────────────────────────────────────

export const monthlyUsageSummary = pgTable('monthly_usage_summary', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  yearMonth: text('year_month').notNull(), // '2025-03'
  funnelsCount: text('funnels_count').notNull().default('0'),
  apiCallsCount: text('api_calls_count').notNull().default('0'),
  stagesSynced: text('stages_synced').notNull().default('0'),
  usersCount: text('users_count').notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id'),
  action: text('action').notNull(), // 'funnel.created', 'integration.connected'
  resourceType: text('resource_type'),
  resourceId: uuid('resource_id'),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const syncJobsRelations = relations(syncJobs, ({ one }) => ({
  organization: one(organizations, {
    fields: [syncJobs.organizationId],
    references: [organizations.id],
  }),
  integration: one(integrations, {
    fields: [syncJobs.integrationId],
    references: [integrations.id],
  }),
  stage: one(funnelStages, {
    fields: [syncJobs.stageId],
    references: [funnelStages.id],
  }),
}))
