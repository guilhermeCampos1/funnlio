import { BaseProvider } from '../../core/base-provider.js'
import type {
  Credentials,
  FetchMetricsOptions,
  FetchMetricsResult,
  ValidateCredentialsResult,
  ResourceItem,
} from '../../core/types.js'
import type { ProviderConfigSchema, ProviderMetric } from '@funnlio/shared'

export class PipedriveProvider extends BaseProvider {
  readonly slug = 'pipedrive'
  readonly name = 'Pipedrive'
  readonly description = 'CRM — leads, deals e pipelines de vendas'
  readonly category = 'crm' as const
  readonly iconUrl = '/icons/pipedrive.svg'

  readonly configSchema: ProviderConfigSchema = {
    authType: 'api_key',
    fields: [
      {
        key: 'api_token',
        label: 'API Token',
        type: 'password',
        required: true,
        helpText: 'Encontre em Configurações > Integrações > API do Pipedrive',
      },
      {
        key: 'company_domain',
        label: 'Domínio da empresa',
        type: 'text',
        required: true,
        helpText: 'Ex: "minhaempresa" de minhaempresa.pipedrive.com',
      },
      {
        key: 'pipeline_id',
        label: 'Pipeline',
        type: 'select',
        required: true,
        helpText: 'Pipeline a observar para esta etapa do funil',
      },
      {
        key: 'stage_ids',
        label: 'Etapas do pipeline (opcional)',
        type: 'multiselect',
        required: false,
        helpText: 'Filtre por etapas específicas do pipeline',
      },
    ],
  }

  readonly availableMetrics: ProviderMetric[] = [
    {
      key: 'leads_count',
      label: 'Leads no Pipeline',
      description: 'Total de leads (deals) no pipeline selecionado',
      type: 'number',
    },
    {
      key: 'leads_in_stage',
      label: 'Leads na Etapa',
      description: 'Leads nas etapas selecionadas do pipeline',
      type: 'number',
    },
    {
      key: 'deals_won',
      label: 'Deals Ganhos',
      description: 'Deals marcados como won no período',
      type: 'number',
    },
    {
      key: 'deals_lost',
      label: 'Deals Perdidos',
      description: 'Deals marcados como lost no período',
      type: 'number',
    },
    {
      key: 'revenue_won',
      label: 'Receita Ganha',
      description: 'Valor total dos deals ganhos',
      type: 'currency',
    },
    {
      key: 'avg_deal_value',
      label: 'Ticket Médio',
      description: 'Valor médio dos deals ganhos',
      type: 'currency',
    },
    {
      key: 'conversion_rate',
      label: 'Taxa de Conversão',
      description: 'Deals ganhos / total de deals no pipeline',
      type: 'percentage',
    },
    {
      key: 'new_deals_count',
      label: 'Novos Deals',
      description: 'Deals criados no período',
      type: 'number',
    },
  ]

  async validateCredentials(credentials: Credentials): Promise<ValidateCredentialsResult> {
    const { api_token, company_domain } = credentials
    if (!api_token || !company_domain) {
      return { valid: false, errorMessage: 'API Token e domínio são obrigatórios' }
    }

    try {
      const response = await fetch(
        `https://${company_domain}.pipedrive.com/api/v1/users/me?api_token=${api_token}`
      )
      const data = await response.json() as { success?: boolean; error?: string }

      if (!data.success) {
        return { valid: false, errorMessage: data.error ?? 'Credenciais inválidas' }
      }
      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        errorMessage: `Erro ao validar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      }
    }
  }

  async fetchMetrics(options: FetchMetricsOptions): Promise<FetchMetricsResult> {
    const { credentials, config, metricKeys, dateRange } = options
    const { api_token, company_domain } = credentials
    const { pipeline_id, stage_ids } = config as {
      pipeline_id: string
      stage_ids?: string[]
    }

    const baseUrl = `https://${company_domain}.pipedrive.com/api/v1`
    const collectedAt = new Date()
    const result: Record<string, number | null> = {}

    // Buscar deals no pipeline para o período
    const since = dateRange.start.toISOString().split('T')[0]
    const until = dateRange.end.toISOString().split('T')[0]

    if (metricKeys.some((k) => ['leads_count', 'leads_in_stage', 'conversion_rate'].includes(k))) {
      const params = new URLSearchParams({
        api_token,
        pipeline_id,
        status: 'all_not_deleted',
        limit: '500',
      })

      const response = await fetch(`${baseUrl}/deals?${params}`)
      const data = await response.json() as {
        success: boolean
        data?: Array<{ id: number; stage_id: number; status: string; value: number; add_time: string }>
      }

      if (data.success && data.data) {
        const allDeals = data.data

        if (metricKeys.includes('leads_count')) {
          result.leads_count = allDeals.length
        }

        if (metricKeys.includes('leads_in_stage') && stage_ids && stage_ids.length > 0) {
          result.leads_in_stage = allDeals.filter((d) =>
            stage_ids.includes(String(d.stage_id))
          ).length
        }

        if (metricKeys.includes('conversion_rate')) {
          const wonDeals = allDeals.filter((d) => d.status === 'won').length
          result.conversion_rate = allDeals.length > 0 ? (wonDeals / allDeals.length) * 100 : 0
        }
      }
    }

    if (metricKeys.some((k) => ['deals_won', 'deals_lost', 'revenue_won', 'avg_deal_value', 'new_deals_count'].includes(k))) {
      const wonParams = new URLSearchParams({
        api_token,
        pipeline_id,
        status: 'won',
        start_date: since,
        end_date: until,
        limit: '500',
      })

      const wonResponse = await fetch(`${baseUrl}/deals?${wonParams}`)
      const wonData = await wonResponse.json() as {
        success: boolean
        data?: Array<{ id: number; value: number; won_time: string }>
      }

      if (wonData.success && wonData.data) {
        const wonDeals = wonData.data

        if (metricKeys.includes('deals_won')) result.deals_won = wonDeals.length
        if (metricKeys.includes('revenue_won')) {
          result.revenue_won = wonDeals.reduce((sum, d) => sum + (d.value ?? 0), 0)
        }
        if (metricKeys.includes('avg_deal_value')) {
          result.avg_deal_value = wonDeals.length > 0
            ? wonDeals.reduce((sum, d) => sum + (d.value ?? 0), 0) / wonDeals.length
            : 0
        }
      }

      if (metricKeys.includes('deals_lost')) {
        const lostParams = new URLSearchParams({
          api_token,
          pipeline_id,
          status: 'lost',
          start_date: since,
          end_date: until,
          limit: '500',
        })
        const lostResponse = await fetch(`${baseUrl}/deals?${lostParams}`)
        const lostData = await lostResponse.json() as { success: boolean; data?: unknown[] }
        if (lostData.success) result.deals_lost = lostData.data?.length ?? 0
      }
    }

    return {
      data: this.buildMetricValues(metricKeys, result),
      collectedAt,
    }
  }

  async listResources(credentials: Credentials, resourceType: string): Promise<ResourceItem[]> {
    const { api_token, company_domain } = credentials
    const baseUrl = `https://${company_domain}.pipedrive.com/api/v1`

    switch (resourceType) {
      case 'pipelines': {
        const response = await fetch(`${baseUrl}/pipelines?api_token=${api_token}`)
        const data = await response.json() as { success: boolean; data?: Array<{ id: number; name: string }> }
        return (data.data ?? []).map((p) => ({ id: String(p.id), label: p.name }))
      }

      case 'stages': {
        const { pipeline_id } = credentials
        if (!pipeline_id) return []
        const response = await fetch(`${baseUrl}/stages?pipeline_id=${pipeline_id}&api_token=${api_token}`)
        const data = await response.json() as { success: boolean; data?: Array<{ id: number; name: string; order_nr: number }> }
        return (data.data ?? [])
          .sort((a, b) => a.order_nr - b.order_nr)
          .map((s) => ({ id: String(s.id), label: s.name }))
      }

      default:
        return []
    }
  }
}
