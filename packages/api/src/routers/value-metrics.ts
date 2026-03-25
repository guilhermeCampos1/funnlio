import { router, protectedProcedure } from '../trpc.js'
import {
  eq, gte, sql,
  funnels, metricSnapshots,
} from '@funnlio/db'

export const valueMetricsRouter = router({
  // Calculate "Seu Mês em Números"
  getMonthlyValue: protectedProcedure.query(async ({ ctx }) => {
    const { organizationId } = ctx.session
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get all stages for this org's funnels with their configs and recent snapshots
    const orgFunnels = await ctx.db.query.funnels.findMany({
      where: eq(funnels.organizationId, organizationId),
      with: { stages: { with: { metricConfigs: true, snapshots: {
        where: gte(metricSnapshots.collectedAt, monthStart),
        limit: 1,
        orderBy: (snapshots, { desc }) => [desc(snapshots.collectedAt)],
      } } } },
    })

    let revenueTracked = 0
    let totalStages = 0
    let totalSyncs = 0
    let bottlenecks = 0

    for (const funnel of orgFunnels) {
      for (const stage of funnel.stages) {
        totalStages++

        const latestSnapshot = stage.snapshots[0]
        if (!latestSnapshot) continue

        totalSyncs++
        const data = latestSnapshot.data as Record<string, number | null>

        // Sum currency metrics for revenue
        for (const config of stage.metricConfigs) {
          if (config.metricType === 'currency' && data[config.metricKey] != null) {
            revenueTracked += data[config.metricKey] as number
          }
        }
      }

      // Count bottlenecks (stages with conversion < 20%)
      for (let i = 1; i < funnel.stages.length; i++) {
        const current = funnel.stages[i]
        const previous = funnel.stages[i - 1]
        if (!current?.snapshots[0] || !previous?.snapshots[0]) continue

        const currentData = current.snapshots[0].data as Record<string, number | null>
        const prevData = previous.snapshots[0].data as Record<string, number | null>

        // Simple conversion check - find primary metrics
        const currentPrimary = current.metricConfigs.find(c => c.isPrimary === 1)
        const prevPrimary = previous.metricConfigs.find(c => c.isPrimary === 1)

        if (currentPrimary && prevPrimary) {
          const currentVal = currentData[currentPrimary.metricKey]
          const prevVal = prevData[prevPrimary.metricKey]
          if (currentVal != null && prevVal != null && prevVal > 0) {
            const convRate = (currentVal / prevVal) * 100
            if (convRate < 20) bottlenecks++
          }
        }
      }
    }

    // Hours saved estimate
    // (stages × syncs_per_month × 5min) / 60
    const activeFunnelCount = orgFunnels.filter(f => f.status === 'active').length
    const syncsPerMonth = 30
    const hoursEstimate = Math.round((totalStages * syncsPerMonth * 5) / 60)

    // Days of data
    const firstSnapshot = await ctx.db.query.metricSnapshots.findFirst({
      orderBy: (snapshots, { asc }) => [asc(snapshots.collectedAt)],
      where: sql`${metricSnapshots.stageId} IN (
        SELECT fs.id FROM funnel_stages fs
        JOIN funnels f ON fs.funnel_id = f.id
        WHERE f.organization_id = ${organizationId}
      )`,
    })

    const daysOfData = firstSnapshot
      ? Math.ceil((now.getTime() - new Date(firstSnapshot.collectedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return {
      revenueTracked,
      hoursSaved: hoursEstimate,
      bottlenecksFound: bottlenecks,
      daysOfData,
      activeFunnels: activeFunnelCount,
      totalStages,
    }
  }),
})
