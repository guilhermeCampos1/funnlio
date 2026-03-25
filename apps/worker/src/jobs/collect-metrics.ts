import type { Job } from 'bullmq'
import {
  db,
  funnelStages,
  integrations,
  metricSnapshots,
  stageMetricConfigs,
  syncJobs,
  eq,
  and,
} from '@funnlio/db'
import { getProvider } from '@funnlio/integrations'
import { getDateRange, decryptCredentials } from '@funnlio/shared'

export interface CollectMetricsPayload {
  jobId: string          // ID do sync_job no banco
  stageId: string
  integrationId: string
  dateRangePreset?: 'last7d' | 'last30d'
  customDateRange?: { start: string; end: string }
}

/**
 * Job principal de coleta de métricas.
 * Executado pelo BullMQ worker para cada etapa de funil.
 */
export async function collectMetrics(job: Job<CollectMetricsPayload>): Promise<void> {
  const { jobId, stageId, integrationId, dateRangePreset, customDateRange } = job.data

  // Marcar job como running
  await db
    .update(syncJobs)
    .set({ status: 'running', startedAt: new Date() })
    .where(eq(syncJobs.id, jobId))

  try {
    // 1. Buscar dados do banco
    const [stage, integration] = await Promise.all([
      db.query.funnelStages.findFirst({
        where: eq(funnelStages.id, stageId),
        with: { metricConfigs: true },
      }),
      db.query.integrations.findFirst({
        where: eq(integrations.id, integrationId),
        with: { provider: true },
      }),
    ])

    if (!stage) throw new Error(`Etapa ${stageId} não encontrada`)
    if (!integration) throw new Error(`Integração ${integrationId} não encontrada`)

    // 2. Obter provider do registry
    const provider = getProvider(integration.provider.slug)

    // 3. Definir período de coleta
    const dateRange = customDateRange
      ? { start: new Date(customDateRange.start), end: new Date(customDateRange.end) }
      : getDateRange(dateRangePreset ?? 'last30d')

    // 4. Extrair métricas configuradas para esta etapa
    const metricKeys = stage.metricConfigs.map((c) => c.metricKey)

    if (metricKeys.length === 0) {
      console.log(`[worker] Etapa ${stageId} sem métricas configuradas — pulando`)
      await markJobSuccess(jobId)
      return
    }

    // 5. Descriptografar credenciais
    const rawCreds = integration.credentials as Record<string, string>
    const credentials = rawCreds.encrypted
      ? decryptCredentials(rawCreds.encrypted)
      : rawCreds
    const config = integration.config as Record<string, string | string[]>

    console.log(`[worker] Coletando ${metricKeys.length} métricas para etapa ${stage.name} via ${provider.name}`)

    // 6. Chamar a API da ferramenta
    const result = await provider.fetchMetrics({
      credentials,
      config,
      metricKeys,
      dateRange,
    })

    // 7. Salvar snapshot
    await db.insert(metricSnapshots).values({
      stageId,
      collectedAt: result.collectedAt,
      dateRangeStart: dateRange.start,
      dateRangeEnd: dateRange.end,
      data: result.data,
      rawResponse: result.rawResponse ?? null,
      collectionJobId: jobId,
    })

    // 8. Atualizar last_synced_at da integração
    await db
      .update(integrations)
      .set({ lastSyncedAt: new Date(), status: 'active', errorMessage: null })
      .where(eq(integrations.id, integrationId))

    await markJobSuccess(jobId)

    console.log(`[worker] Sucesso: etapa ${stage.name} — ${Object.keys(result.data).length} métricas coletadas`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[worker] Erro ao coletar métricas para etapa ${stageId}:`, errorMessage)

    // Marcar integração com erro
    await db
      .update(integrations)
      .set({ status: 'error', errorMessage })
      .where(eq(integrations.id, integrationId))

    await db
      .update(syncJobs)
      .set({ status: 'failed', finishedAt: new Date(), error: errorMessage })
      .where(eq(syncJobs.id, jobId))

    throw error // re-throw para BullMQ fazer retry
  }
}

async function markJobSuccess(jobId: string) {
  await db
    .update(syncJobs)
    .set({ status: 'success', finishedAt: new Date() })
    .where(eq(syncJobs.id, jobId))
}
