import { BaseProvider } from '../../core/base-provider.js'
import type { Credentials, FetchMetricsOptions, FetchMetricsResult, ValidateCredentialsResult } from '../../core/types.js'
import type { ProviderConfigSchema, ProviderMetric } from '@funnlio/shared'

export class ClarityProvider extends BaseProvider {
  readonly slug = 'microsoft_clarity'
  readonly name = 'Microsoft Clarity'
  readonly description = 'Heatmaps, sessões e comportamento dos usuários na LP'
  readonly category = 'heatmap' as const
  readonly iconUrl = '/icons/clarity.svg'

  readonly configSchema: ProviderConfigSchema = {
    authType: 'api_key',
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        required: true,
        helpText: 'Encontre em Settings > API do projeto no Clarity',
      },
      {
        key: 'project_id',
        label: 'ID do Projeto',
        type: 'text',
        required: true,
        helpText: 'ID do projeto Clarity a monitorar',
      },
    ],
  }

  readonly availableMetrics: ProviderMetric[] = [
    { key: 'sessions', label: 'Sessões', description: 'Total de sessões no período', type: 'number' },
    { key: 'users', label: 'Usuários', description: 'Usuários únicos no período', type: 'number' },
    { key: 'pages_per_session', label: 'Páginas por Sessão', description: 'Média de páginas por sessão', type: 'number' },
    { key: 'scroll_depth', label: 'Profundidade de Scroll', description: 'Scroll médio na página (%)', type: 'percentage' },
    { key: 'dead_clicks', label: 'Dead Clicks', description: 'Cliques em elementos sem resposta', type: 'number' },
    { key: 'rage_clicks', label: 'Rage Clicks', description: 'Cliques repetidos de frustração', type: 'number' },
    { key: 'bounce_rate', label: 'Taxa de Rejeição', description: 'Sessões de uma única página (%)', type: 'percentage' },
    { key: 'avg_session_duration', label: 'Duração Média', description: 'Tempo médio de sessão em segundos', type: 'duration' },
  ]

  async validateCredentials(_credentials: Credentials): Promise<ValidateCredentialsResult> {
    // TODO: Implementar validação via Clarity API
    return { valid: false, errorMessage: 'Microsoft Clarity: implementação em andamento' }
  }

  async fetchMetrics(_options: FetchMetricsOptions): Promise<FetchMetricsResult> {
    // TODO: Implementar via Clarity API v1
    throw new Error('Clarity provider: implementação em andamento')
  }
}
