import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations } from './organizations'

export const integrationCategoryEnum = pgEnum('integration_category', [
  'ads',
  'crm',
  'analytics',
  'heatmap',
  'email',
  'other',
])

export const integrationStatusEnum = pgEnum('integration_status', [
  'active',
  'error',
  'revoked',
  'pending',
])

// ─── Integration Providers (catálogo global de ferramentas) ───────────────────

export const integrationProviders = pgTable('integration_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').unique().notNull(), // 'meta_ads', 'google_ads', etc.
  name: text('name').notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  category: integrationCategoryEnum('category').notNull(),
  // JSON Schema descrevendo campos de configuração necessários
  configSchema: jsonb('config_schema').notNull().default({}),
  // Métricas disponíveis com seus tipos e descrições
  metricsSchema: jsonb('metrics_schema').notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Integrations (conexões por organização) ──────────────────────────────────

export const integrations = pgTable(
  'integrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    providerId: uuid('provider_id')
      .notNull()
      .references(() => integrationProviders.id),
    name: text('name').notNull(), // nome amigável dado pelo usuário
    status: integrationStatusEnum('status').notNull().default('pending'),
    // ENCRYPTED: tokens, api_keys - nunca expor em resposta da API
    credentials: jsonb('credentials').notNull().default({}),
    // account_id, pipeline_id, campaign_ids, etc.
    config: jsonb('config').notNull().default({}),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('integrations_org_provider_name_idx').on(
      table.organizationId,
      table.providerId,
      table.name
    ),
  ]
)

// ─── Relations ────────────────────────────────────────────────────────────────

export const integrationProvidersRelations = relations(integrationProviders, ({ many }) => ({
  integrations: many(integrations),
}))

export const integrationsRelations = relations(integrations, ({ one }) => ({
  organization: one(organizations, {
    fields: [integrations.organizationId],
    references: [organizations.id],
  }),
  provider: one(integrationProviders, {
    fields: [integrations.providerId],
    references: [integrationProviders.id],
  }),
}))
