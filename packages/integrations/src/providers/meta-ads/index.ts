import { BaseProvider } from '../../core/base-provider.js'
import type {
  Credentials,
  FetchMetricsOptions,
  FetchMetricsResult,
  ValidateCredentialsResult,
  ResourceItem,
} from '../../core/types.js'
import type { ProviderConfigSchema, ProviderMetric } from '@funnlio/shared'

interface MetaInsightsResponse {
  data: Array<{
    impressions?: string
    clicks?: string
    spend?: string
    reach?: string
    frequency?: string
    actions?: Array<{ action_type: string; value: string }>
    cost_per_action_type?: Array<{ action_type: string; value: string }>
    ctr?: string
    cpc?: string
    cpp?: string
    date_start?: string
    date_stop?: string
  }>
  paging?: unknown
  error?: { message: string; code: number }
}

export class MetaAdsProvider extends BaseProvider {
  readonly slug = 'meta_ads'
  readonly name = 'Meta Ads'
  readonly description = 'Facebook e Instagram Ads — campanhas, conjuntos e anúncios'
  readonly category = 'ads' as const
  readonly iconUrl = '/icons/meta-ads.svg'

  readonly configSchema: ProviderConfigSchema = {
    authType: 'api_key',
    fields: [
      {
        key: 'access_token',
        label: 'Access Token',
        type: 'password',
        required: true,
        helpText: 'User Access Token do Graph API Explorer (developers.facebook.com/tools/explorer). Selecione seu app, adicione permissao ads_read e clique "Gerar Token". Tokens de App ou Page nao funcionam.',
        placeholder: 'EAAxxxxxxx...',
      },
      {
        key: 'ad_account_id',
        label: 'ID da Conta de Anúncios',
        type: 'select',
        required: true,
        helpText: 'O ID começa com "act_". Ex: act_123456789',
      },
      {
        key: 'campaign_ids',
        label: 'Campanhas (opcional)',
        type: 'multiselect',
        required: false,
        helpText: 'Filtre por campanhas específicas. Deixe vazio para considerar todas.',
      },
    ],
  }

  readonly availableMetrics: ProviderMetric[] = [
    {
      key: 'impressions',
      label: 'Impressões',
      description: 'Número de vezes que os anúncios foram exibidos',
      type: 'number',
    },
    {
      key: 'reach',
      label: 'Alcance',
      description: 'Número de pessoas únicas que viram os anúncios',
      type: 'number',
    },
    {
      key: 'clicks',
      label: 'Cliques',
      description: 'Total de cliques nos anúncios',
      type: 'number',
    },
    {
      key: 'spend',
      label: 'Investimento',
      description: 'Total gasto no período',
      type: 'currency',
    },
    {
      key: 'ctr',
      label: 'CTR',
      description: 'Taxa de cliques (cliques / impressões)',
      type: 'percentage',
    },
    {
      key: 'cpc',
      label: 'CPC',
      description: 'Custo por clique',
      type: 'currency',
    },
    {
      key: 'cpm',
      label: 'CPM',
      description: 'Custo por mil impressões',
      type: 'currency',
    },
    {
      key: 'leads',
      label: 'Leads',
      description: 'Total de leads gerados (ação: lead)',
      type: 'number',
    },
    {
      key: 'cpl',
      label: 'CPL',
      description: 'Custo por lead',
      type: 'currency',
    },
    {
      key: 'frequency',
      label: 'Frequência',
      description: 'Média de vezes que cada pessoa viu o anúncio',
      type: 'number',
    },
    {
      key: 'link_clicks',
      label: 'Cliques no Link',
      description: 'Cliques no link do anúncio (exclui curtidas, comentários, etc.)',
      type: 'number',
    },
    {
      key: 'landing_page_views',
      label: 'Visualizações da LP',
      description: 'Pessoas que clicaram e carregaram a landing page',
      type: 'number',
    },
  ]

  async validateCredentials(credentials: Credentials): Promise<ValidateCredentialsResult> {
    const { access_token } = credentials
    if (!access_token) {
      return { valid: false, errorMessage: 'Access token é obrigatório' }
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/me?access_token=${access_token}`
      )
      const data = await response.json() as { id?: string; error?: { message: string } }

      if (data.error) {
        let msg = data.error.message
        // Map common Meta API errors to helpful Portuguese messages
        if (msg.toLowerCase().includes('hex') || msg.toLowerCase().includes('64 ')) {
          msg = 'Token invalido. Use um User Access Token gerado no Graph API Explorer (developers.facebook.com/tools/explorer) com permissao ads_read. Tokens de App ou Page nao funcionam aqui.'
        } else if (msg.toLowerCase().includes('expired')) {
          msg = 'Token expirado. Gere um novo no Graph API Explorer.'
        } else if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('permiss')) {
          msg = 'Token sem permissao ads_read. Regenere o token incluindo essa permissao no Graph API Explorer.'
        }
        return { valid: false, errorMessage: msg }
      }
      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        errorMessage: `Erro ao validar credenciais: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      }
    }
  }

  async fetchMetrics(options: FetchMetricsOptions): Promise<FetchMetricsResult> {
    const { credentials, config, metricKeys, dateRange } = options
    const { access_token } = credentials
    const { ad_account_id, campaign_ids } = config as {
      ad_account_id: string
      campaign_ids?: string[]
    }

    const validKeys = this.filterValidMetricKeys(metricKeys)

    // Mapear chaves internas para campos da API Meta
    const metaFields = this.mapMetricKeysToFields(validKeys)

    const since = dateRange.start.toISOString().split('T')[0]
    const until = dateRange.end.toISOString().split('T')[0]

    const params = new URLSearchParams({
      access_token,
      fields: metaFields.join(','),
      time_range: JSON.stringify({ since, until }),
      level: 'account',
    })

    // Filtrar por campanhas específicas se configurado
    if (campaign_ids && campaign_ids.length > 0) {
      params.set('filtering', JSON.stringify([{ field: 'campaign.id', operator: 'IN', value: campaign_ids }]))
      params.set('level', 'campaign')
    }

    const url = `https://graph.facebook.com/v21.0/${ad_account_id}/insights?${params}`
    const response = await fetch(url)
    const raw = await response.json() as MetaInsightsResponse

    if (raw.error) {
      throw new Error(`Meta Ads API error: ${raw.error.message}`)
    }

    const collectedAt = new Date()

    if (!raw.data || raw.data.length === 0) {
      return {
        data: this.buildMetricValues(validKeys, {}),
        rawResponse: raw,
        collectedAt,
      }
    }

    // Agregar dados de múltiplas campanhas se necessário
    const aggregated = this.aggregateMetaData(raw.data)
    const parsed = this.parseMetaResponse(aggregated, validKeys)

    return {
      data: this.buildMetricValues(validKeys, parsed),
      rawResponse: raw,
      collectedAt,
    }
  }

  async listResources(credentials: Credentials, resourceType: string): Promise<ResourceItem[]> {
    const { access_token } = credentials

    switch (resourceType) {
      case 'ad_accounts': {
        const response = await fetch(
          `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_status&access_token=${access_token}`
        )
        const data = await response.json() as { data?: Array<{ id: string; name: string }> }
        return (data.data ?? []).map((account) => ({
          id: account.id,
          label: `${account.name} (${account.id})`,
        }))
      }

      case 'campaigns': {
        // Requer ad_account_id no credentials como contexto
        const { ad_account_id } = credentials
        if (!ad_account_id) return []

        const response = await fetch(
          `https://graph.facebook.com/v21.0/${ad_account_id}/campaigns?fields=id,name,status&access_token=${access_token}`
        )
        const data = await response.json() as { data?: Array<{ id: string; name: string; status: string }> }
        return (data.data ?? []).map((campaign) => ({
          id: campaign.id,
          label: `${campaign.name} [${campaign.status}]`,
        }))
      }

      default:
        return []
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private mapMetricKeysToFields(keys: string[]): string[] {
    const fieldMap: Record<string, string> = {
      impressions: 'impressions',
      reach: 'reach',
      clicks: 'clicks',
      spend: 'spend',
      ctr: 'ctr',
      cpc: 'cpc',
      cpm: 'cpm',
      frequency: 'frequency',
      leads: 'actions',
      cpl: 'cost_per_action_type',
      link_clicks: 'actions',
      landing_page_views: 'actions',
    }

    const fields = new Set<string>()
    for (const key of keys) {
      const field = fieldMap[key]
      if (field) fields.add(field)
    }
    return Array.from(fields)
  }

  private aggregateMetaData(
    rows: MetaInsightsResponse['data']
  ): MetaInsightsResponse['data'][0] {
    if (rows.length === 1) return rows[0]

    // Agregar somas de múltiplas campanhas
    const result: MetaInsightsResponse['data'][0] = {}
    for (const row of rows) {
      if (row.impressions) result.impressions = String((Number(result.impressions ?? 0) + Number(row.impressions)))
      if (row.clicks) result.clicks = String((Number(result.clicks ?? 0) + Number(row.clicks)))
      if (row.reach) result.reach = String((Number(result.reach ?? 0) + Number(row.reach)))
      if (row.spend) result.spend = String((Number(result.spend ?? 0) + Number(row.spend)))
      if (row.actions) result.actions = [...(result.actions ?? []), ...row.actions]
      if (row.cost_per_action_type) {
        result.cost_per_action_type = [
          ...(result.cost_per_action_type ?? []),
          ...row.cost_per_action_type,
        ]
      }
    }
    return result
  }

  private parseMetaResponse(
    row: MetaInsightsResponse['data'][0],
    requestedKeys: string[]
  ): Record<string, number | null> {
    const result: Record<string, number | null> = {}

    if (requestedKeys.includes('impressions')) result.impressions = Number(row.impressions ?? 0)
    if (requestedKeys.includes('reach')) result.reach = Number(row.reach ?? 0)
    if (requestedKeys.includes('clicks')) result.clicks = Number(row.clicks ?? 0)
    if (requestedKeys.includes('spend')) result.spend = Number(row.spend ?? 0)
    if (requestedKeys.includes('ctr')) result.ctr = Number(row.ctr ?? 0)
    if (requestedKeys.includes('cpc')) result.cpc = Number(row.cpc ?? 0)
    if (requestedKeys.includes('cpm')) result.cpm = Number(row.cpp ?? 0)
    if (requestedKeys.includes('frequency')) result.frequency = Number(row.frequency ?? 0)

    // Ações precisam ser extraídas do array de actions
    if (row.actions) {
      if (requestedKeys.includes('leads')) {
        const leadAction = row.actions.find((a) => a.action_type === 'lead')
        result.leads = leadAction ? Number(leadAction.value) : 0
      }
      if (requestedKeys.includes('link_clicks')) {
        const linkClick = row.actions.find((a) => a.action_type === 'link_click')
        result.link_clicks = linkClick ? Number(linkClick.value) : 0
      }
      if (requestedKeys.includes('landing_page_views')) {
        const lpView = row.actions.find((a) => a.action_type === 'landing_page_view')
        result.landing_page_views = lpView ? Number(lpView.value) : 0
      }
    }

    if (row.cost_per_action_type && requestedKeys.includes('cpl')) {
      const cplAction = row.cost_per_action_type.find((a) => a.action_type === 'lead')
      result.cpl = cplAction ? Number(cplAction.value) : null
    }

    return result
  }
}
