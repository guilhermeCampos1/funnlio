import cron from 'node-cron'
import { Queue } from 'bullmq'
import {
  db,
  funnelStages,
  integrations,
  organizations,
  syncJobs,
  funnels,
  eq,
  and,
  isNotNull,
} from '@funnlio/db'
import { PLAN_SYNC_INTERVALS } from '@funnlio/shared'
import type { CollectMetricsPayload } from './jobs/collect-metrics.js'
import type { DetectInsightsPayload } from './jobs/detect-insights.js'

let metricsQueue: Queue<CollectMetricsPayload>
let insightsQueue: Queue<DetectInsightsPayload>

export function initScheduler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mQueue: Queue<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  iQueue?: Queue<any>,
) {
  metricsQueue = mQueue
  if (iQueue) insightsQueue = iQueue

  // A cada 15 minutos: verificar quais etapas precisam de sync
  cron.schedule('*/15 * * * *', async () => {
    console.log('[scheduler] Verificando etapas para sync...')
    await enqueueStagesNeedingSync()
  })

  // A cada 6 horas: detectar insights automáticos
  cron.schedule('0 */6 * * *', async () => {
    console.log('[scheduler] Detectando insights...')
    await enqueueInsightDetection()
  })

  console.log('[scheduler] Scheduler iniciado')
}

/**
 * Verifica quais etapas estão com sync vencido com base no plano da organização
 * e enfileira jobs para elas.
 */
async function enqueueStagesNeedingSync() {
  try {
    // Buscar todas as etapas com integração configurada
    const stages = await db.query.funnelStages.findMany({
      where: isNotNull(funnelStages.integrationId),
      with: {
        integration: true,
        funnel: {
          with: { organization: true },
        },
        snapshots: {
          orderBy: (snap, { desc }) => [desc(snap.collectedAt)],
          limit: 1,
        },
      },
    })

    const now = Date.now()
    let enqueued = 0

    for (const stage of stages) {
      if (!stage.integration || !stage.funnel?.organization) continue

      const org = stage.funnel.organization
      const plan = org.plan as keyof typeof PLAN_SYNC_INTERVALS
      const interval = PLAN_SYNC_INTERVALS[plan]

      const lastSync = stage.snapshots[0]?.collectedAt
      const lastSyncMs = lastSync ? lastSync.getTime() : 0
      const timeSinceSync = now - lastSyncMs

      if (timeSinceSync < interval) continue

      // Enfileirar job
      await enqueueSync({
        stageId: stage.id,
        integrationId: stage.integration.id,
        organizationId: org.id,
      })
      enqueued++
    }

    if (enqueued > 0) {
      console.log(`[scheduler] ${enqueued} etapa(s) enfileirada(s) para sync`)
    }
  } catch (error) {
    console.error('[scheduler] Erro ao verificar etapas:', error)
  }
}

async function enqueueInsightDetection() {
  if (!insightsQueue) return
  try {
    const orgs = await db
      .select({ id: organizations.id })
      .from(organizations)

    for (const org of orgs) {
      await insightsQueue.add(
        'detect-insights',
        { organizationId: org.id },
        { attempts: 2, backoff: { type: 'fixed', delay: 5000 } },
      )
    }
    console.log(`[scheduler] ${orgs.length} org(s) enfileirada(s) para análise de insights`)
  } catch (error) {
    console.error('[scheduler] Erro ao enfileirar insights:', error)
  }
}

export async function enqueueSync({
  stageId,
  integrationId,
  organizationId,
  trigger = 'scheduled',
  priority = 10,
}: {
  stageId: string
  integrationId: string
  organizationId: string
  trigger?: 'scheduled' | 'manual'
  priority?: number
}) {
  // Criar registro no banco
  const [job] = await db
    .insert(syncJobs)
    .values({
      organizationId,
      integrationId,
      stageId,
      status: 'queued',
      trigger,
    })
    .returning()

  // Adicionar à fila BullMQ
  await metricsQueue.add(
    'collect-metrics',
    {
      jobId: job.id,
      stageId,
      integrationId,
    },
    {
      priority,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    }
  )

  return job
}
