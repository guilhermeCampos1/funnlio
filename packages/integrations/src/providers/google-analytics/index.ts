import { BaseProvider } from '../../core/base-provider.js'
import type {
  Credentials,
  FetchMetricsOptions,
  FetchMetricsResult,
  ValidateCredentialsResult,
  ResourceItem,
} from '../../core/types.js'
import type { ProviderConfigSchema, ProviderMetric } from '@funnlio/shared'

interface TokenResponse {
  access_token: string
  expires_in: number
  error?: string
  error_description?: string
}

interface GA4ReportResponse {
  rows?: Array<{
    dimensionValues: Array<{ value: string }>
    metricValues: Array<{ value: string }>
  }>
  totals?: Array<{ metricValues: Array<{ value: string }> }>
  error?: { message: string }
}

interface GA4Property {
  name: string
  displayName: string
}

export class GoogleAnalyticsProvider extends BaseProvider {
  readonly slug = 'google_analytics'
  readonly name = 'Google Analytics 4'
  readonly description = 'Sessões, conversões e comportamento de usuários (GA4)'
  readonly category = 'analytics' as const
  readonly iconUrl = '/icons/google-analytics.svg'

  readonly configSchema: ProviderConfigSchema = {
    authType: 'oauth2',
    fields: [
      {
        key: 'property_id',
        label: 'ID da Propriedade GA4',
        type: 'select',
        required: true,
        helpText: 'Formato: properties/123456789',
      },
      {
        key: 'event_names',
        label: 'Eventos de Conversão (opcional)',
        type: 'multiselect',
        required: false,
        helpText: 'Filtre por eventos. Ex: purchase, lead',
      },
    ],
  }

  readonly availableMetrics: ProviderMetric[] = [
    { key: 'sessions', label: 'Sessões', description: 'Total de sessões', type: 'number' },
    { key: 'active_users', label: 'Usuários Ativos', description: 'Usuários que visitaram', type: 'number' },
    { key: 'new_users', label: 'Novos Usuários', description: 'Primeiras visitas', type: 'number' },
    { key: 'pageviews', label: 'Visualizações', description: 'Páginas visualizadas', type: 'number' },
    { key: 'bounce_rate', label: 'Taxa de Rejeição', description: 'Sessões sem engajamento (%)', type: 'percentage' },
    { key: 'avg_session_duration', label: 'Duração Média', description: 'Tempo médio por sessão (s)', type: 'duration' },
    { key: 'conversions', label: 'Conversões', description: 'Total de eventos de conversão', type: 'number' },
    { key: 'revenue', label: 'Receita', description: 'Receita total de e-commerce', type: 'currency' },
  ]

  private async getAccessToken(credentials: Credentials): Promise<string> {
    if (credentials['access_token'] && credentials['token_expires_at']) {
      if (Date.now() < Number(credentials['token_expires_at']) - 60_000) {
        return credentials['access_token']!
      }
    }
    const refreshToken = credentials['refresh_token']
    if (!refreshToken) throw new Error('refresh_token não encontrado')

    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    const d = (await resp.json()) as TokenResponse
    if (d.error) throw new Error(`Google OAuth: ${d.error_description}`)
    return d.access_token
  }

  async validateCredentials(credentials: Credentials): Promise<ValidateCredentialsResult> {
    try {
      const token = await this.getAccessToken(credentials)
      const propertyId = credentials['property_id']!
      const resp = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/${propertyId}/metadata`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!resp.ok) {
        const contentType = resp.headers.get('content-type') ?? ''
        if (!contentType.includes('application/json')) {
          return { valid: false, errorMessage: `Google Analytics retornou erro ${resp.status}. Verifique o Property ID e tente novamente.` }
        }
        const err = (await resp.json()) as { error?: { message?: string } }
        return { valid: false, errorMessage: err.error?.message ?? 'Propriedade invalida' }
      }
      return { valid: true }
    } catch (err) {
      return { valid: false, errorMessage: err instanceof Error ? err.message : 'Erro de validação' }
    }
  }

  async fetchMetrics(options: FetchMetricsOptions): Promise<FetchMetricsResult> {
    const { credentials, metricKeys, dateRange } = options
    const token = await this.getAccessToken(credentials)
    const propertyId = credentials['property_id']!

    const metricNameMap: Record<string, string> = {
      sessions: 'sessions',
      active_users: 'activeUsers',
      new_users: 'newUsers',
      pageviews: 'screenPageViews',
      bounce_rate: 'bounceRate',
      avg_session_duration: 'averageSessionDuration',
      conversions: 'conversions',
      revenue: 'purchaseRevenue',
    }

    const gaMetrics = metricKeys
      .map(k => ({ name: metricNameMap[k] ?? k }))
      .filter(m => m.name)

    if (!gaMetrics.length) gaMetrics.push({ name: 'sessions' })

    const startDate = dateRange.start.toISOString().split('T')[0]!
    const endDate = dateRange.end.toISOString().split('T')[0]!

    const resp = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          metrics: gaMetrics,
          dimensions: [{ name: 'date' }],
          metricAggregations: ['TOTAL'],
          keepEmptyRows: false,
        }),
      },
    )

    if (!resp.ok) {
      const err = (await resp.json()) as GA4ReportResponse
      throw new Error(err.error?.message ?? 'GA4 API error')
    }

    const report = (await resp.json()) as GA4ReportResponse
    const totalsRow = report.totals?.[0]

    const data: Record<string, number | null> = {}
    metricKeys.forEach((key, idx) => {
      const raw = Number(totalsRow?.metricValues?.[idx]?.value ?? 0)
      data[key] = key === 'bounce_rate' ? raw * 100 : raw
    })

    return { data, collectedAt: new Date() }
  }

  async listResources(credentials: Credentials, _resourceType: string): Promise<ResourceItem[]> {
    const token = await this.getAccessToken(credentials)
    const resp = await fetch(
      'https://analyticsadmin.googleapis.com/v1beta/properties?pageSize=200',
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!resp.ok) return []
    const res = (await resp.json()) as { properties?: GA4Property[] }
    return (res.properties ?? []).map(p => ({ id: p.name, label: p.displayName }))
  }
}
