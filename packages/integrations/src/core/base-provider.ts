import type {
  IntegrationProvider,
  Credentials,
  Config,
  FetchMetricsOptions,
  FetchMetricsResult,
  ValidateCredentialsResult,
  ResourceItem,
} from './types.js'
import type { IntegrationCategory, ProviderConfigSchema, ProviderMetric } from '@funnlio/shared'

/**
 * Classe base abstrata que todos os providers devem estender.
 * Fornece implementações padrão e garante consistência entre providers.
 */
export abstract class BaseProvider implements IntegrationProvider {
  abstract readonly slug: string
  abstract readonly name: string
  abstract readonly description: string
  abstract readonly category: IntegrationCategory
  abstract readonly iconUrl: string
  abstract readonly configSchema: ProviderConfigSchema
  abstract readonly availableMetrics: ProviderMetric[]

  abstract validateCredentials(credentials: Credentials): Promise<ValidateCredentialsResult>

  abstract fetchMetrics(options: FetchMetricsOptions): Promise<FetchMetricsResult>

  // Implementação padrão retorna lista vazia — providers sobrescrevem se necessário
  async listResources(
    _credentials: Credentials,
    _resourceType: string
  ): Promise<ResourceItem[]> {
    return []
  }

  /**
   * Helper para filtrar apenas as métricas que existem neste provider.
   */
  protected filterValidMetricKeys(metricKeys: string[]): string[] {
    const validKeys = new Set(this.availableMetrics.map((m) => m.key))
    return metricKeys.filter((k) => validKeys.has(k))
  }

  /**
   * Helper para montar resposta de métricas com null para chaves não encontradas.
   */
  protected buildMetricValues(
    requestedKeys: string[],
    fetched: Record<string, number | null>
  ): Record<string, number | null> {
    const result: Record<string, number | null> = {}
    for (const key of requestedKeys) {
      result[key] = fetched[key] ?? null
    }
    return result
  }
}
