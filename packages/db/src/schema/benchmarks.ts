import { pgTable, uuid, text, timestamp, numeric, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations } from './organizations'

export const verticalEnum = pgEnum('vertical', ['ecommerce', 'infoproduto', 'saas', 'servico', 'agencia', 'other'])

export const benchmarks = pgTable('benchmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  vertical: verticalEnum('vertical').notNull(),
  metricKey: text('metric_key').notNull(),
  avgValue: numeric('avg_value', { precision: 15, scale: 4 }).notNull(),
  medianValue: numeric('median_value', { precision: 15, scale: 4 }),
  p25Value: numeric('p25_value', { precision: 15, scale: 4 }),
  p75Value: numeric('p75_value', { precision: 15, scale: 4 }),
  sampleSize: text('sample_size').notNull().default('0'),
  calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Organization vertical setting
export const organizationVerticals = pgTable('organization_verticals', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  vertical: verticalEnum('vertical').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const organizationVerticalsRelations = relations(organizationVerticals, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationVerticals.organizationId],
    references: [organizations.id],
  }),
}))
