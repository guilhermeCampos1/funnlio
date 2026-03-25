import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations, users } from './organizations'

export const memberPermissionEnum = pgEnum('member_permission', ['viewer', 'editor', 'admin'])

export const memberPermissions = pgTable('member_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  permission: memberPermissionEnum('permission').notNull().default('viewer'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const memberPermissionsRelations = relations(memberPermissions, ({ one }) => ({
  organization: one(organizations, {
    fields: [memberPermissions.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [memberPermissions.userId],
    references: [users.id],
  }),
}))
