import { pgTable, uuid, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations } from './organizations'

export const healthSegmentEnum = pgEnum('health_segment', ['purple', 'green', 'yellow', 'red'])

export const customerHealth = pgTable('customer_health', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  score: integer('score').notNull().default(0), // 0-100
  segment: healthSegmentEnum('segment').notNull().default('green'),
  loginFrequency: integer('login_frequency').notNull().default(0), // logins in last 30 days
  activeFunnels: integer('active_funnels').notNull().default(0),
  featuresUsed: integer('features_used').notNull().default(0),
  activeMembers: integer('active_members').notNull().default(0),
  daysSinceLastSync: integer('days_since_last_sync'),
  lastCalculatedAt: timestamp('last_calculated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const customerHealthRelations = relations(customerHealth, ({ one }) => ({
  organization: one(organizations, {
    fields: [customerHealth.organizationId],
    references: [organizations.id],
  }),
}))
