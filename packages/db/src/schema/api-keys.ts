import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations } from './organizations'

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull(), // SHA-256 hash of the key
  keyPrefix: text('key_prefix').notNull(), // First 8 chars for identification
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
})

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
}))

// Webhook configs
export const webhookConfigs = pgTable('webhook_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  secret: text('secret').notNull(), // for HMAC verification
  events: text('events').notNull(), // JSON array of event types
  isActive: boolean('is_active').notNull().default(true),
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
  failureCount: text('failure_count').notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const webhookLogs = pgTable('webhook_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookConfigId: uuid('webhook_config_id')
    .notNull()
    .references(() => webhookConfigs.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  payload: text('payload').notNull(), // JSON
  responseStatus: text('response_status'),
  responseBody: text('response_body'),
  success: boolean('success').notNull(),
  attemptNumber: text('attempt_number').notNull().default('1'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const webhookConfigsRelations = relations(webhookConfigs, ({ one }) => ({
  organization: one(organizations, {
    fields: [webhookConfigs.organizationId],
    references: [organizations.id],
  }),
}))

export const webhookLogsRelations = relations(webhookLogs, ({ one }) => ({
  config: one(webhookConfigs, {
    fields: [webhookLogs.webhookConfigId],
    references: [webhookConfigs.id],
  }),
}))
