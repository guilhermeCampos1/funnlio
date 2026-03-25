import { BaseProvider } from '../../core/base-provider.js'
import type { Credentials, FetchMetricsOptions, FetchMetricsResult, ValidateCredentialsResult } from '../../core/types.js'
import type { ProviderConfigSchema, ProviderMetric } from '@funnlio/shared'

interface ClarityPeriod {
  totalSessionCount?: number
  distinctUsersCount?: number
  pagesPerSession?: number
  scrollDepth?: number
  deadClickCount?: number
  rageClickCount?: number
  bounceRate?: number
  avgSessionDuration?: number
}

interface ClarityMetricsResponse {
  currentPeriod?: ClarityPeriod
  error?: { message?: string }
}

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
        placeholder: 'Bearer ...',
      },
      {
        key: 'project_id',
        label: 'ID do Projeto',
        type: 'text',
        required: true,
        helpText: 'ID do projeto Clarity (ex: abc123xyz)',
        placeholder: 'abc123xyz',
      },
    ],
  }

  readonly availableMetrics: ProviderMetric[] = [
    { key: 'sessions', label: 'Sessões', description: 'Total de sessões', type: 'number' },
    { key: 'users', label: 'Usuários', description: 'Usuários únicos', type: 'number' },
    { key: 'pages_per_session', label: 'Páginas por Sessão', description: 'Média de páginas por sessão', type: 'number' },
    { key: 'scroll_depth', label: 'Profundidade de Scroll', description: 'Scroll médio (%)', type: 'percentage' },
    { key: 'dead_clicks', label: 'Dead Clicks', description: 'Cliques sem resposta', type: 'number' },
    { key: 'rage_clicks', label: 'Rage Clicks', description: 'Cliques repetidos de frustração', type: 'number' },
    { key: 'bounce_rate', label: 'Taxa de Rejeição', description: 'Sessões de uma página (%)', type: 'percentage' },
    { key: 'avg_session_duration', label: 'Duração Média', description: 'Tempo médio de sessão (s)', type: 'duration' },
  ]

  private authHeader(credentials: Credentials): string {
    const key = credentials['api_key'] ?? ''
    return key.startsWith('Bearer ') ? key : `Bearer ${key}`
  }

  async validateCredentials(credentials: Credentials): Promise<ValidateCredentialsResult> {
    try {
      const projectId = credentials['project_id']!
      const resp = await fetch(`https://www.clarity.ms/api/v1/projects/${projectId}`, {
        headers: { Authorization: this.authHeader(credentials) },
      })
      if (resp.status === 401 || resp.status === 403) return { valid: false, errorMessage: 'API Key inválida ou sem permissão' }
      if (resp.status === 404) return { valid: false, errorMessage: 'Projeto não encontrado' }
      if (!resp.ok) return { valid: false, errorMessage: `Erro Clarity (${resp.status})` }
      return { valid: true }
    } catch (err) {
      return { valid: false, errorMessage: err instanceof Error ? err.message : 'Erro de validação' }
    }
  }

  async fetchMetrics(options: FetchMetricsOptions): Promise<FetchMetricsResult> {
    const { credentials, metricKeys, dateRange } = options
    const projectId = credentials['project_id']!

    const startDate = dateRange.start.toISOString().split('T')[0]!
    const endDate = dateRange.end.toISOString().split('T')[0]!
    const numOfDays = Math.max(1, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / 86_400_000))

    const params = new URLSearchParams({ startDate, endDate, numOfDays: String(numOfDays) })
    const resp = await fetch(`https://www.clarity.ms/api/v1/${projectId}/metrics?${params}`, {
      headers: { Authorization: this.authHeader(credentials), 'Content-Type': 'application/json' },
    })

    if (!resp.ok) {
      const err = (await resp.json()) as ClarityMetricsResponse
      throw new Error(err.error?.message ?? `Clarity API error (${resp.status})`)
    }

    const body = (await resp.json()) as ClarityMetricsResponse
    const p = body.currentPeriod ?? {}

    const mapping: Record<string, number> = {
      sessions: p.totalSessionCount ?? 0,
      users: p.distinctUsersCount ?? 0,
      pages_per_session: p.pagesPerSession ?? 0,
      scroll_depth: (p.scrollDepth ?? 0) * 100,
      dead_clicks: p.deadClickCount ?? 0,
      rage_clicks: p.rageClickCount ?? 0,
      bounce_rate: (p.bounceRate ?? 0) * 100,
      avg_session_duration: p.avgSessionDuration ?? 0,
    }

    const data: Record<string, number | null> = {}
    for (const key of metricKeys) {
      data[key] = mapping[key] ?? null
    }

    return { data, collectedAt: new Date() }
  }
}
