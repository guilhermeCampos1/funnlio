import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations } from './organizations'
import { funnels } from './funnels'

export const publicLinks = pgTable('public_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  funnelId: uuid('funnel_id')
    .notNull()
    .references(() => funnels.id, { onDelete: 'cascade' }),
  token: text('token').unique().notNull(),
  isActive: boolean('is_active').notNull().default(true),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  password: text('password'), // optional password protection
  showBranding: boolean('show_branding').notNull().default(true),
  allowedMetrics: text('allowed_metrics'), // JSON array of metric keys, null = all
  viewCount: integer('view_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const publicLinksRelations = relations(publicLinks, ({ one }) => ({
  organization: one(organizations, {
    fields: [publicLinks.organizationId],
    references: [organizations.id],
  }),
  funnel: one(funnels, {
    fields: [publicLinks.funnelId],
    references: [funnels.id],
  }),
}))
