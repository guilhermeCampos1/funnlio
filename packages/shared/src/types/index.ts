// ─── Plans ────────────────────────────────────────────────────────────────────

export type Plan = 'trial' | 'starter' | 'pro' | 'enterprise'

export type OrgRole = 'owner' | 'admin' | 'viewer'

export type UserRole = 'saas_admin' | 'member'

// ─── Funnels ──────────────────────────────────────────────────────────────────

export type FunnelStatus = 'active' | 'paused' | 'archived'

export interface FunnelSummary {
  id: string
  name: string
  description: string | null
  status: FunnelStatus
  color: string | null
  stageCount: number
  topConversionRate: number | null
  overallConversionRate: number | null
  lastSyncedAt: Date | null
  createdAt: Date
}

export interface FunnelStageMetric {
  key: string
  label: string
  value: number | null
  type: MetricType
  isPrimary: boolean
}

export interface FunnelStageDetail {
  id: string
  name: string
  description: string | null
  position: number
  integration: {
    id: string
    name: string
    providerSlug: string
    providerName: string
    status: IntegrationStatus
  } | null
  metrics: FunnelStageMetric[]
  conversionRateFromPrevious: number | null
  targetValue: number | null
  lastSyncedAt: Date | null
}

// ─── Integrations ─────────────────────────────────────────────────────────────

export type IntegrationCategory = 'ads' | 'crm' | 'analytics' | 'heatmap' | 'email' | 'other'

export type IntegrationStatus = 'active' | 'error' | 'revoked' | 'pending'

export type MetricType = 'number' | 'currency' | 'percentage' | 'duration'

export type MetricAggregation = 'sum' | 'avg' | 'last' | 'min' | 'max'

export interface ProviderMetric {
  key: string
  label: string
  description: string
  type: MetricType
  requiresConfig?: string[]
}

export interface ProviderConfigField {
  key: string
  label: string
  type: 'text' | 'select' | 'multiselect' | 'oauth' | 'password'
  required: boolean
  helpText?: string
  placeholder?: string
}

export interface ProviderConfigSchema {
  authType: 'api_key' | 'oauth2' | 'basic'
  fields: ProviderConfigField[]
}

export interface ProviderDefinition {
  slug: string
  name: string
  description: string
  category: IntegrationCategory
  iconUrl: string
  configSchema: ProviderConfigSchema
  availableMetrics: ProviderMetric[]
}

// ─── Sync / Jobs ──────────────────────────────────────────────────────────────

export type SyncJobStatus = 'queued' | 'running' | 'success' | 'failed' | 'cancelled'

export type SyncTrigger = 'scheduled' | 'manual' | 'webhook'

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface OrgHealthStatus {
  status: 'healthy' | 'warning' | 'critical'
  errorRate: number
  lastSyncedAt: Date | null
}

export interface AdminOrgSummary {
  id: string
  name: string
  slug: string
  plan: Plan
  planExpiresAt: Date | null
  health: OrgHealthStatus
  funnelsCount: number
  integrationsCount: number
  usersCount: number
  mrr: number
  createdAt: Date
}

// ─── Date ranges ──────────────────────────────────────────────────────────────

export interface DateRange {
  start: Date
  end: Date
}

export type DateRangePreset = 'today' | 'yesterday' | 'last7d' | 'last30d' | 'last90d' | 'custom'
