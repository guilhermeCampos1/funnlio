import { pgTable, uuid, text, timestamp, boolean, pgEnum, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations } from './organizations'

export const reportFrequencyEnum = pgEnum('report_frequency', ['daily', 'weekly', 'monthly'])

export const reportSettings = pgTable('report_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  frequency: reportFrequencyEnum('frequency').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  recipients: jsonb('recipients').notNull().default([]), // string[] of emails
  includeInsights: boolean('include_insights').notNull().default(true),
  includeMetrics: boolean('include_metrics').notNull().default(true),
  sendTime: text('send_time').notNull().default('08:00'), // HH:mm format
  lastSentAt: timestamp('last_sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reportSettingsRelations = relations(reportSettings, ({ one }) => ({
  organization: one(organizations, {
    fields: [reportSettings.organizationId],
    references: [organizations.id],
  }),
}))
