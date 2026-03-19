import { BaseProvider } from '../../core/base-provider.js'
import type { Credentials, FetchMetricsOptions, FetchMetricsResult, ValidateCredentialsResult } from '../../core/types.js'
import type { ProviderConfigSchema, ProviderMetric } from '@funnlio/shared'

export class GoogleAdsProvider extends BaseProvider {
  readonly slug = 'google_ads'
  readonly name = 'Google Ads'
  readonly description = 'Search, Display, YouTube e Shopping Ads'
  readonly category = 'ads' as const
  readonly iconUrl = '/icons/google-ads.svg'

  readonly configSchema: ProviderConfigSchema = {
    authType: 'oauth2',
    fields: [
      {
        key: 'customer_id',
        label: 'ID do Cliente Google Ads',
        type: 'text',
        required: true,
        helpText: 'Formato: 123-456-7890 (sem hifens: 1234567890)',
      },
      {
        key: 'campaign_ids',
        label: 'Campanhas (opcional)',
        type: 'multiselect',
        required: false,
        helpText: 'Filtre por campanhas específicas',
      },
    ],
  }

  readonly availableMetrics: ProviderMetric[] = [
    { key: 'impressions', label: 'Impressões', description: 'Número de impressões dos anúncios', type: 'number' },
    { key: 'clicks', label: 'Cliques', description: 'Total de cliques', type: 'number' },
    { key: 'cost', label: 'Investimento', description: 'Custo total no período', type: 'currency' },
    { key: 'conversions', label: 'Conversões', description: 'Total de conversões rastreadas', type: 'number' },
    { key: 'ctr', label: 'CTR', description: 'Taxa de cliques', type: 'percentage' },
    { key: 'avg_cpc', label: 'CPC Médio', description: 'Custo médio por clique', type: 'currency' },
    { key: 'conversion_rate', label: 'Taxa de Conversão', description: 'Conversões / cliques', type: 'percentage' },
    { key: 'cost_per_conversion', label: 'Custo por Conversão', description: 'Custo / conversões', type: 'currency' },
  ]

  async validateCredentials(_credentials: Credentials): Promise<ValidateCredentialsResult> {
    // TODO: Implementar OAuth2 com Google Ads API
    return { valid: false, errorMessage: 'Google Ads: implementação OAuth2 em andamento' }
  }

  async fetchMetrics(_options: FetchMetricsOptions): Promise<FetchMetricsResult> {
    // TODO: Implementar usando Google Ads API v18 + OAuth2
    throw new Error('Google Ads provider: implementação em andamento')
  }
}
