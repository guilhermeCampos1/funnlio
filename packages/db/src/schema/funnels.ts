import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  numeric,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations, users } from './organizations'
import { integrations } from './integrations'

export const funnelStatusEnum = pgEnum('funnel_status', ['active', 'paused', 'archived'])

// ─── Funnels ──────────────────────────────────────────────────────────────────

export const funnels = pgTable('funnels', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  status: funnelStatusEnum('status').notNull().default('active'),
  color: text('color'), // hex color
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Funnel Stages ────────────────────────────────────────────────────────────

export const funnelStages = pgTable(
  'funnel_stages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    funnelId: uuid('funnel_id')
      .notNull()
      .references(() => funnels.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    position: integer('position').notNull(),
    // Integração associada a esta etapa (pode ser null antes de configurar)
    integrationId: uuid('integration_id').references(() => integrations.id, {
      onDelete: 'set null',
    }),
    // Config específica da etapa: qual campanha, pipeline, etc. a observar
    metricConfig: jsonb('metric_config').notNull().default({}),
    targetValue: numeric('target_value', { precision: 15, scale: 4 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('funnel_stages_funnel_id_position_idx').on(table.funnelId, table.position)]
)

// ─── Relations ────────────────────────────────────────────────────────────────

export const funnelsRelations = relations(funnels, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [funnels.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [funnels.createdBy],
    references: [users.id],
  }),
  stages: many(funnelStages),
}))

export const funnelStagesRelations = relations(funnelStages, ({ one, many }) => ({
  funnel: one(funnels, {
    fields: [funnelStages.funnelId],
    references: [funnels.id],
  }),
  integration: one(integrations, {
    fields: [funnelStages.integrationId],
    references: [integrations.id],
  }),
  metricConfigs: many(stageMetricConfigs),
  snapshots: many(metricSnapshots),
}))

// ─── Stage Metric Configs ─────────────────────────────────────────────────────

export const metricTypeEnum = pgEnum('metric_type', [
  'number',
  'currency',
  'percentage',
  'duration',
])
export const metricAggregationEnum = pgEnum('metric_aggregation', [
  'sum',
  'avg',
  'last',
  'min',
  'max',
])

export const stageMetricConfigs = pgTable('stage_metric_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  stageId: uuid('stage_id')
    .notNull()
    .references(() => funnelStages.id, { onDelete: 'cascade' }),
  metricKey: text('metric_key').notNull(),
  label: text('label').notNull(),
  metricType: metricTypeEnum('metric_type').notNull().default('number'),
  isPrimary: integer('is_primary').notNull().default(0), // 0 = false, 1 = true (boolean workaround)
  displayFormat: text('display_format'),
  aggregation: metricAggregationEnum('aggregation').notNull().default('sum'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const stageMetricConfigsRelations = relations(stageMetricConfigs, ({ one }) => ({
  stage: one(funnelStages, {
    fields: [stageMetricConfigs.stageId],
    references: [funnelStages.id],
  }),
}))

// ─── Metric Snapshots ─────────────────────────────────────────────────────────

export const metricSnapshots = pgTable('metric_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  stageId: uuid('stage_id')
    .notNull()
    .references(() => funnelStages.id, { onDelete: 'cascade' }),
  collectedAt: timestamp('collected_at', { withTimezone: true }).notNull(),
  dateRangeStart: timestamp('date_range_start').notNull(),
  dateRangeEnd: timestamp('date_range_end').notNull(),
  // { impressions: 1500, clicks: 230, leads: 45, ... }
  data: jsonb('data').notNull(),
  // Resposta bruta da API para debug
  rawResponse: jsonb('raw_response'),
  collectionJobId: text('collection_job_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const metricSnapshotsRelations = relations(metricSnapshots, ({ one }) => ({
  stage: one(funnelStages, {
    fields: [metricSnapshots.stageId],
    references: [funnelStages.id],
  }),
}))
