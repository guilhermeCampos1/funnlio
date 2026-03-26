import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations } from './organizations'
import { funnels, funnelStages } from './funnels'

export const insightTypeEnum = pgEnum('insight_type', [
  'conversion_drop',
  'conversion_spike',
  'funnel_bottleneck',
  'spend_anomaly',
  'milestone',
])

export const insightSeverityEnum = pgEnum('insight_severity', [
  'info',
  'warning',
  'critical',
])

export const insights = pgTable('insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  funnelId: uuid('funnel_id').references(() => funnels.id, { onDelete: 'cascade' }),
  stageId: uuid('stage_id').references(() => funnelStages.id, { onDelete: 'cascade' }),
  type: insightTypeEnum('type').notNull(),
  severity: insightSeverityEnum('severity').notNull().default('info'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  metadata: text('metadata'), // JSON string with details
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Alert settings per org
export const alertSettings = pgTable('alert_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  alertType: text('alert_type').notNull(), // 'conversion_drop', 'spend_anomaly', 'sync_failed', etc.
  enabled: boolean('enabled').notNull().default(true),
  emailEnabled: boolean('email_enabled').notNull().default(true),
  slackEnabled: boolean('slack_enabled').notNull().default(false),
  threshold: text('threshold'), // JSON config for thresholds
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const insightsRelations = relations(insights, ({ one }) => ({
  organization: one(organizations, {
    fields: [insights.organizationId],
    references: [organizations.id],
  }),
  funnel: one(funnels, {
    fields: [insights.funnelId],
    references: [funnels.id],
  }),
  stage: one(funnelStages, {
    fields: [insights.stageId],
    references: [funnelStages.id],
  }),
}))

export const alertSettingsRelations = relations(alertSettings, ({ one }) => ({
  organization: one(organizations, {
    fields: [alertSettings.organizationId],
    references: [organizations.id],
  }),
}))
