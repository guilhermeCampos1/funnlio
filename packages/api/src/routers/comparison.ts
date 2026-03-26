import { router, protectedProcedure, z, TRPCError } from '../trpc.js'
import { eq, and, gte, lte, organizations, funnels, metricSnapshots } from '@funnlio/db'
import { hasFeatureAccess } from '@funnlio/shared'
import type { Plan } from '@funnlio/shared'

export const comparisonRouter = router({
  compare: protectedProcedure
    .input(z.object({
      funnelId: z.string().uuid(),
      periodA: z.object({ start: z.string(), end: z.string() }),
      periodB: z.object({ start: z.string(), end: z.string() }),
    }))
    .query(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      // Check feature gate
      const org = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
      })
      if (!org) throw new TRPCError({ code: 'NOT_FOUND' })
      const plan = org.plan as Plan
      const trialExpired = plan === 'trial' && org.planExpiresAt && new Date(org.planExpiresAt) < new Date()
      if (!hasFeatureAccess(plan, 'comparison', !!trialExpired)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Comparação de períodos requer plano Pro' })
      }

      // Get funnel with stages
      const funnel = await ctx.db.query.funnels.findFirst({
        where: and(eq(funnels.id, input.funnelId), eq(funnels.organizationId, organizationId)),
        with: {
          stages: {
            with: { metricConfigs: true },
            orderBy: (s, { asc }) => [asc(s.position)],
          },
        },
      })
      if (!funnel) throw new TRPCError({ code: 'NOT_FOUND' })

      // For each stage, get the latest snapshot in each period
      const results = await Promise.all(
        funnel.stages.map(async (stage) => {
          const [snapshotA] = await ctx.db.query.metricSnapshots.findMany({
            where: and(
              eq(metricSnapshots.stageId, stage.id),
              gte(metricSnapshots.dateRangeStart, new Date(input.periodA.start)),
              lte(metricSnapshots.dateRangeEnd, new Date(input.periodA.end))
            ),
            orderBy: (s, { desc }) => [desc(s.collectedAt)],
            limit: 1,
          })

          const [snapshotB] = await ctx.db.query.metricSnapshots.findMany({
            where: and(
              eq(metricSnapshots.stageId, stage.id),
              gte(metricSnapshots.dateRangeStart, new Date(input.periodB.start)),
              lte(metricSnapshots.dateRangeEnd, new Date(input.periodB.end))
            ),
            orderBy: (s, { desc }) => [desc(s.collectedAt)],
            limit: 1,
          })

          const dataA = (snapshotA?.data ?? {}) as Record<string, number | null>
          const dataB = (snapshotB?.data ?? {}) as Record<string, number | null>

          // Calculate deltas for each metric
          const metrics = stage.metricConfigs.map((config) => {
            const valueA = dataA[config.metricKey]
            const valueB = dataB[config.metricKey]
            let delta: number | null = null
            let deltaPercent: number | null = null

            if (valueA != null && valueB != null && valueA !== 0) {
              delta = valueB - valueA
              deltaPercent = ((valueB - valueA) / Math.abs(valueA)) * 100
            }

            return {
              key: config.metricKey,
              label: config.label,
              type: config.metricType,
              valueA,
              valueB,
              delta,
              deltaPercent,
            }
          })

          return {
            stageId: stage.id,
            stageName: stage.name,
            position: stage.position,
            metrics,
          }
        })
      )

      return {
        funnelName: funnel.name,
        periodA: input.periodA,
        periodB: input.periodB,
        stages: results,
      }
    }),
})
