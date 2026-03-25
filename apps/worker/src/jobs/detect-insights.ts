import type { Job } from 'bullmq'
import {
  db,
  funnels,
  funnelStages,
  metricSnapshots,
  insights,
  alertSettings,
  organizations,
  eq,
  and,
  desc,
  gte,
} from '@funnlio/db'

export interface DetectInsightsPayload {
  organizationId: string
  funnelId?: string
}

interface StageSnapshot {
  stageId: string
  stageName: string
  position: number
  data: Record<string, number>
  collectedAt: Date
}

const CONVERSION_DROP_THRESHOLD = 0.25
const CONVERSION_SPIKE_THRESHOLD = 0.5
const SPEND_ANOMALY_THRESHOLD = 0.5

export async function detectInsights(job: Job<DetectInsightsPayload>): Promise<void> {
  const { organizationId, funnelId } = job.data

  const funnelList = funnelId
    ? await db.select({ id: funnels.id, name: funnels.name }).from(funnels).where(
        and(eq(funnels.organizationId, organizationId), eq(funnels.id, funnelId)),
      )
    : await db.select({ id: funnels.id, name: funnels.name }).from(funnels).where(
        eq(funnels.organizationId, organizationId),
      )

  for (const funnel of funnelList) {
    await analyzeFunnel(organizationId, funnel.id)
  }
}

async function analyzeFunnel(organizationId: string, funnelId: string): Promise<void> {
  const stages = await db
    .select({ id: funnelStages.id, name: funnelStages.name, position: funnelStages.position })
    .from(funnelStages)
    .where(eq(funnelStages.funnelId, funnelId))
    .orderBy(funnelStages.position)

  if (stages.length < 2) return

  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000)
  const midpoint = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const currentSnapshots: StageSnapshot[] = []
  const previousSnapshots: StageSnapshot[] = []

  for (const stage of stages) {
    const snaps = await db
      .select({ data: metricSnapshots.data, collectedAt: metricSnapshots.collectedAt })
      .from(metricSnapshots)
      .where(and(eq(metricSnapshots.stageId, stage.id), gte(metricSnapshots.collectedAt, cutoff48h)))
      .orderBy(desc(metricSnapshots.collectedAt))
      .limit(10)

    if (!snaps.length) continue

    const currentVals: Record<string, number> = {}
    const prevVals: Record<string, number> = {}

    for (const snap of snaps) {
      const d = (snap.data ?? {}) as Record<string, number>
      const target = snap.collectedAt >= midpoint ? currentVals : prevVals
      for (const [k, v] of Object.entries(d)) {
        if (typeof v === 'number') target[k] = (target[k] ?? 0) + v
      }
    }

    if (Object.keys(currentVals).length) {
      currentSnapshots.push({ stageId: stage.id, stageName: stage.name, position: stage.position, data: currentVals, collectedAt: new Date() })
    }
    if (Object.keys(prevVals).length) {
      previousSnapshots.push({ stageId: stage.id, stageName: stage.name, position: stage.position, data: prevVals, collectedAt: midpoint })
    }
  }

  if (!currentSnapshots.length || !previousSnapshots.length) return

  // Detect conversion drops/spikes
  for (let i = 1; i < currentSnapshots.length; i++) {
    const prev = currentSnapshots[i - 1]!
    const curr = currentSnapshots[i]!

    const currentRate = calcRate(prev.data, curr.data)
    const prevPrev = previousSnapshots.find(s => s.stageId === prev.stageId)
    const prevCurr = previousSnapshots.find(s => s.stageId === curr.stageId)
    if (!prevPrev || !prevCurr) continue

    const previousRate = calcRate(prevPrev.data, prevCurr.data)
    if (currentRate === null || previousRate === null || previousRate === 0) continue

    const delta = (currentRate - previousRate) / previousRate

    if (delta <= -CONVERSION_DROP_THRESHOLD) {
      await upsertInsight({
        organizationId, funnelId, stageId: curr.stageId,
        type: 'conversion_drop',
        severity: delta <= -0.5 ? 'critical' : 'warning',
        title: `Queda de conversão em "${curr.stageName}"`,
        description: `Conversão de "${prev.stageName}" → "${curr.stageName}" caiu ${Math.abs(delta * 100).toFixed(1)}% (${(previousRate * 100).toFixed(1)}% → ${(currentRate * 100).toFixed(1)}%).`,
        metadata: { from: prev.stageName, to: curr.stageName, previousRate, currentRate, delta },
      })
    } else if (delta >= CONVERSION_SPIKE_THRESHOLD) {
      await upsertInsight({
        organizationId, funnelId, stageId: curr.stageId,
        type: 'conversion_spike',
        severity: 'info',
        title: `Pico de conversão em "${curr.stageName}"`,
        description: `Conversão de "${prev.stageName}" → "${curr.stageName}" subiu ${(delta * 100).toFixed(1)}% (${(previousRate * 100).toFixed(1)}% → ${(currentRate * 100).toFixed(1)}%).`,
        metadata: { from: prev.stageName, to: curr.stageName, previousRate, currentRate, delta },
      })
    }
  }

  // Detect bottleneck
  if (currentSnapshots.length >= 3) {
    let minRate: number | null = null
    let bottleneck: StageSnapshot | null = null
    for (let i = 1; i < currentSnapshots.length; i++) {
      const rate = calcRate(currentSnapshots[i - 1]!.data, currentSnapshots[i]!.data)
      if (rate !== null && (minRate === null || rate < minRate)) {
        minRate = rate
        bottleneck = currentSnapshots[i]!
      }
    }
    if (bottleneck && minRate !== null && minRate < 0.1) {
      await upsertInsight({
        organizationId, funnelId, stageId: bottleneck.stageId,
        type: 'funnel_bottleneck',
        severity: 'warning',
        title: `Gargalo em "${bottleneck.stageName}"`,
        description: `Menor taxa de conversão do funil: ${(minRate * 100).toFixed(1)}%.`,
        metadata: { stageName: bottleneck.stageName, conversionRate: minRate },
      })
    }
  }

  // Detect spend anomaly
  for (const stage of currentSnapshots) {
    const spend = stage.data['spend'] ?? stage.data['cost'] ?? null
    const prevStage = previousSnapshots.find(s => s.stageId === stage.stageId)
    const prevSpend = prevStage ? (prevStage.data['spend'] ?? prevStage.data['cost'] ?? null) : null

    if (spend !== null && prevSpend !== null && prevSpend > 0) {
      const delta = (spend - prevSpend) / prevSpend
      if (delta >= SPEND_ANOMALY_THRESHOLD) {
        await upsertInsight({
          organizationId, funnelId, stageId: stage.stageId,
          type: 'spend_anomaly',
          severity: delta >= 1 ? 'critical' : 'warning',
          title: `Anomalia de gasto em "${stage.stageName}"`,
          description: `Gasto aumentou ${(delta * 100).toFixed(1)}% em relação ao período anterior.`,
          metadata: { stageName: stage.stageName, previousSpend: prevSpend, currentSpend: spend, delta },
        })
      }
    }
  }

  // Slack notification
  await maybeNotifySlack(organizationId, funnelId)
}

function calcRate(from: Record<string, number>, to: Record<string, number>): number | null {
  const fromCount = from['clicks'] ?? from['sessions'] ?? from['leads'] ?? null
  const toCount = to['conversions'] ?? to['deals_created'] ?? to['sessions'] ?? null
  if (fromCount && toCount && fromCount > 0) return Math.min(1, toCount / fromCount)
  return null
}

interface InsightInput {
  organizationId: string
  funnelId: string
  stageId: string
  type: 'conversion_drop' | 'conversion_spike' | 'funnel_bottleneck' | 'spend_anomaly' | 'milestone'
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  metadata: Record<string, unknown>
}

async function upsertInsight(input: InsightInput): Promise<void> {
  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000)
  const existing = await db
    .select({ id: insights.id })
    .from(insights)
    .where(and(
      eq(insights.organizationId, input.organizationId),
      eq(insights.stageId, input.stageId),
      eq(insights.type, input.type),
      gte(insights.createdAt, cutoff),
    ))
    .limit(1)

  if (existing.length) return

  await db.insert(insights).values({
    organizationId: input.organizationId,
    funnelId: input.funnelId,
    stageId: input.stageId,
    type: input.type,
    severity: input.severity,
    title: input.title,
    description: input.description,
    metadata: JSON.stringify(input.metadata),
  })
  console.info(`[detect-insights] ${input.severity}: ${input.title}`)
}

async function maybeNotifySlack(organizationId: string, funnelId: string): Promise<void> {
  const settings = await db
    .select({ threshold: alertSettings.threshold })
    .from(alertSettings)
    .where(and(eq(alertSettings.organizationId, organizationId), eq(alertSettings.slackEnabled, true)))
    .limit(1)

  if (!settings.length) return
  const cfg = settings[0]!.threshold ? (JSON.parse(settings[0]!.threshold) as { webhookUrl?: string }) : {}
  if (!cfg.webhookUrl) return

  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000)
  const recent = await db
    .select({ title: insights.title, description: insights.description })
    .from(insights)
    .where(and(
      eq(insights.organizationId, organizationId),
      eq(insights.funnelId, funnelId),
      gte(insights.createdAt, cutoff),
    ))
    .limit(5)

  if (!recent.length) return

  await fetch(cfg.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: '🔔 Funnlio — Novos Insights' } },
        ...recent.map(i => ({ type: 'section', text: { type: 'mrkdwn', text: `*${i.title}*\n${i.description}` } })),
      ],
    }),
  }).catch(err => console.error('[detect-insights] Slack failed:', err))
}
