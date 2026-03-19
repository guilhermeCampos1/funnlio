import type {
  DateRange,
  IntegrationCategory,
  MetricType,
  ProviderConfigSchema,
  ProviderMetric,
} from '@funnlio/shared'

// ─── Core types for the integration layer ────────────────────────────────────

export type Credentials = Record<string, string>
export type Config = Record<string, string | string[]>
export type MetricValues = Record<string, number | null>

export interface ResourceItem {
  id: string
  label: string
  parentId?: string
  metadata?: Record<string, unknown>
}

export interface FetchMetricsOptions {
  credentials: Credentials
  config: Config
  metricKeys: string[]
  dateRange: DateRange
}

export interface FetchMetricsResult {
  data: MetricValues
  rawResponse?: unknown
  collectedAt: Date
}

export interface ValidateCredentialsResult {
  valid: boolean
  errorMessage?: string
}

// ─── Provider interface ───────────────────────────────────────────────────────

export interface IntegrationProvider {
  readonly slug: string
  readonly name: string
  readonly description: string
  readonly category: IntegrationCategory
  readonly iconUrl: string
  readonly configSchema: ProviderConfigSchema
  readonly availableMetrics: ProviderMetric[]

  /**
   * Valida se as credenciais são válidas e têm acesso suficiente.
   */
  validateCredentials(credentials: Credentials): Promise<ValidateCredentialsResult>

  /**
   * Busca os valores das métricas solicitadas para o período informado.
   */
  fetchMetrics(options: FetchMetricsOptions): Promise<FetchMetricsResult>

  /**
   * Lista recursos disponíveis (campanhas, pipelines, contas, etc.).
   * Opcional — nem todos os providers precisam implementar.
   */
  listResources?(
    credentials: Credentials,
    resourceType: string
  ): Promise<ResourceItem[]>
}

export { DateRange, IntegrationCategory, MetricType }
