import { BaseProvider } from '../../core/base-provider.js'
import type { Credentials, FetchMetricsOptions, FetchMetricsResult, ValidateCredentialsResult } from '../../core/types.js'
import type { ProviderConfigSchema, ProviderMetric } from '@funnlio/shared'

export class GoogleAnalyticsProvider extends BaseProvider {
  readonly slug = 'google_analytics'
  readonly name = 'Google Analytics 4'
  readonly description = 'Sessões, conversões e eventos do GA4'
  readonly category = 'analytics' as const
  readonly iconUrl = '/icons/google-analytics.svg'

  readonly configSchema: ProviderConfigSchema = {
    authType: 'oauth2',
    fields: [
      {
        key: 'property_id',
        label: 'ID da Propriedade GA4',
        type: 'text',
        required: true,
        helpText: 'Ex: 123456789 (sem o prefixo "properties/")',
      },
    ],
  }

  readonly availableMetrics: ProviderMetric[] = [
    { key: 'sessions', label: 'Sessões', description: 'Total de sessões', type: 'number' },
    { key: 'users', label: 'Usuários', description: 'Usuários ativos', type: 'number' },
    { key: 'new_users', label: 'Novos Usuários', description: 'Novos usuários no período', type: 'number' },
    { key: 'pageviews', label: 'Pageviews', description: 'Total de visualizações de página', type: 'number' },
    { key: 'bounce_rate', label: 'Taxa de Rejeição', description: 'Taxa de rejeição (%)', type: 'percentage' },
    { key: 'avg_session_duration', label: 'Duração Média', description: 'Tempo médio de sessão em segundos', type: 'duration' },
    { key: 'conversions', label: 'Conversões', description: 'Total de conversões/eventos-chave', type: 'number' },
    { key: 'conversion_rate', label: 'Taxa de Conversão', description: 'Conversões / sessões (%)', type: 'percentage' },
  ]

  async validateCredentials(_credentials: Credentials): Promise<ValidateCredentialsResult> {
    // TODO: Implementar OAuth2 com Google Analytics Data API v1
    return { valid: false, errorMessage: 'Google Analytics: implementação OAuth2 em andamento' }
  }

  async fetchMetrics(_options: FetchMetricsOptions): Promise<FetchMetricsResult> {
    // TODO: Implementar via Google Analytics Data API v1
    throw new Error('Google Analytics provider: implementação em andamento')
  }
}
