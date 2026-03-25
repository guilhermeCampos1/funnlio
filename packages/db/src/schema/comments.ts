import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations, users } from './organizations'
import { funnelStages } from './funnels'

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  stageId: uuid('stage_id')
    .notNull()
    .references(() => funnelStages.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const commentsRelations = relations(comments, ({ one }) => ({
  organization: one(organizations, {
    fields: [comments.organizationId],
    references: [organizations.id],
  }),
  stage: one(funnelStages, {
    fields: [comments.stageId],
    references: [funnelStages.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}))
