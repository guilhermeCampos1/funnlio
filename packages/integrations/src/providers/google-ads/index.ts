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

interface CampaignRow {
  campaign: { id: string; name: string; status: string }
  metrics: {
    impressions: string
    clicks: string
    costMicros: string
    conversions: string
    conversionsValue: string
    ctr: string
    averageCpc: string
  }
}

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
        placeholder: '1234567890',
      },
      {
        key: 'campaign_ids',
        label: 'Campanhas (opcional)',
        type: 'multiselect',
        required: false,
        helpText: 'Filtre por campanhas específicas. Deixe vazio para todas.',
      },
    ],
  }

  readonly availableMetrics: ProviderMetric[] = [
    { key: 'impressions', label: 'Impressões', description: 'Número de vezes exibidos', type: 'number' },
    { key: 'clicks', label: 'Cliques', description: 'Total de cliques', type: 'number' },
    { key: 'spend', label: 'Gasto Total', description: 'Valor total gasto', type: 'currency' },
    { key: 'conversions', label: 'Conversões', description: 'Total de conversões', type: 'number' },
    { key: 'conversions_value', label: 'Valor das Conversões', description: 'Receita das conversões', type: 'currency' },
    { key: 'ctr', label: 'CTR', description: 'Taxa de cliques (%)', type: 'percentage' },
    { key: 'avg_cpc', label: 'CPC Médio', description: 'Custo médio por clique', type: 'currency' },
    { key: 'roas', label: 'ROAS', description: 'Retorno sobre investimento em ads', type: 'number' },
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
    const data = (await resp.json()) as TokenResponse
    if (data.error) throw new Error(`Google OAuth: ${data.error_description}`)
    return data.access_token
  }

  async validateCredentials(credentials: Credentials): Promise<ValidateCredentialsResult> {
    try {
      const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
      if (!devToken) {
        return {
          valid: false,
          errorMessage: 'Google Ads ainda nao esta disponivel. O administrador precisa configurar o Developer Token. Entre em contato com o suporte.',
        }
      }

      const token = await this.getAccessToken(credentials)
      const customerId = credentials['customer_id']!.replace(/-/g, '')
      // listAccessibleCustomers is a class-level method (no customer ID in path)
      const resp = await fetch(
        'https://googleads.googleapis.com/v18/customers:listAccessibleCustomers',
        { headers: { Authorization: `Bearer ${token}`, 'developer-token': devToken } },
      )
      // Verify the provided customer ID is in the accessible list
      if (resp.ok) {
        const data = (await resp.json()) as { resourceNames?: string[] }
        const accessible = (data.resourceNames ?? []).map((r: string) => r.replace('customers/', ''))
        if (!accessible.includes(customerId)) {
          return { valid: false, errorMessage: `A conta ${credentials['customer_id']} nao esta acessivel com esta conta Google. Contas disponiveis: ${accessible.join(', ')}` }
        }
        return { valid: true }
      }
      if (!resp.ok) {
        const contentType = resp.headers.get('content-type') ?? ''
        if (!contentType.includes('application/json')) {
          return { valid: false, errorMessage: `Google Ads retornou erro ${resp.status}. Verifique o Customer ID e tente novamente.` }
        }
        const err = (await resp.json()) as { error?: { message?: string } }
        return { valid: false, errorMessage: err.error?.message ?? 'Credenciais invalidas' }
      }
      return { valid: true }
    } catch (err) {
      return { valid: false, errorMessage: err instanceof Error ? err.message : 'Erro de validacao' }
    }
  }

  async fetchMetrics(options: FetchMetricsOptions): Promise<FetchMetricsResult> {
    const { credentials, metricKeys, dateRange } = options
    const token = await this.getAccessToken(credentials)
    const customerId = credentials['customer_id']!.replace(/-/g, '')
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? ''

    const gaqlMap: Record<string, string> = {
      impressions: 'metrics.impressions',
      clicks: 'metrics.clicks',
      spend: 'metrics.cost_micros',
      conversions: 'metrics.conversions',
      conversions_value: 'metrics.conversions_value',
      ctr: 'metrics.ctr',
      avg_cpc: 'metrics.average_cpc',
    }

    const gaqlMetrics = metricKeys.map(k => gaqlMap[k]).filter(Boolean).join(', ') || 'metrics.impressions'
    const start = dateRange.start.toISOString().split('T')[0]
    const end = dateRange.end.toISOString().split('T')[0]

    const campaignFilter = credentials['campaign_ids']
      ? `AND campaign.id IN (${String(credentials['campaign_ids']).split(',').map(id => `'${id.trim()}'`).join(',')})`
      : ''

    const query = `SELECT campaign.id, campaign.name, campaign.status, ${gaqlMetrics}
      FROM campaign
      WHERE segments.date BETWEEN '${start}' AND '${end}'
        AND campaign.status != 'REMOVED' ${campaignFilter}
      ORDER BY metrics.cost_micros DESC LIMIT 100`

    const resp = await fetch(
      `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'developer-token': devToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      },
    )

    if (!resp.ok) {
      const err = (await resp.json()) as { error?: { message?: string } }
      throw new Error(err.error?.message ?? 'Google Ads API error')
    }

    const rows = (await resp.json()) as CampaignRow[]
    let totalSpendMicros = 0
    let totalConversions = 0
    let totalConversionsValue = 0
    const totals: Record<string, number> = { impressions: 0, clicks: 0 }

    for (const row of rows) {
      const m = row.metrics
      totals['impressions'] = (totals['impressions'] ?? 0) + Number(m.impressions ?? 0)
      totals['clicks'] = (totals['clicks'] ?? 0) + Number(m.clicks ?? 0)
      totalSpendMicros += Number(m.costMicros ?? 0)
      totalConversions += Number(m.conversions ?? 0)
      totalConversionsValue += Number(m.conversionsValue ?? 0)
    }

    totals['spend'] = totalSpendMicros / 1_000_000
    totals['conversions'] = totalConversions
    totals['conversions_value'] = totalConversionsValue
    const impressions = totals['impressions'] ?? 0
    const clicks = totals['clicks'] ?? 0
    totals['ctr'] = impressions ? (clicks / impressions) * 100 : 0
    totals['avg_cpc'] = clicks ? totalSpendMicros / clicks / 1_000_000 : 0
    totals['roas'] = totals['spend'] ? totalConversionsValue / totals['spend'] : 0

    const data: Record<string, number | null> = {}
    for (const key of metricKeys) {
      data[key] = totals[key] ?? null
    }

    return { data, collectedAt: new Date() }
  }

  async listResources(credentials: Credentials, _resourceType: string): Promise<ResourceItem[]> {
    const token = await this.getAccessToken(credentials)
    const customerId = credentials['customer_id']!.replace(/-/g, '')
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? ''

    const query = `SELECT campaign.id, campaign.name FROM campaign WHERE campaign.status = 'ENABLED' ORDER BY campaign.name LIMIT 200`
    const resp = await fetch(
      `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'developer-token': devToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      },
    )
    if (!resp.ok) return []
    const res = (await resp.json()) as { results?: CampaignRow[] }
    return (res.results ?? []).map(r => ({ id: r.campaign.id, label: r.campaign.name }))
  }
}
