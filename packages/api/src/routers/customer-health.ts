import { router, adminProcedure } from '../trpc.js'
import { customerHealth, eq, sql, desc } from '@funnlio/db'

export const customerHealthRouter = router({
  // Get health scores for all orgs (admin only)
  list: adminProcedure.query(async ({ ctx }) => {
    const healthRecords = await ctx.db.query.customerHealth.findMany({
      with: { organization: true },
      orderBy: [desc(customerHealth.score)],
    })

    return healthRecords.map(h => ({
      organizationId: h.organizationId,
      organizationName: h.organization.name,
      plan: h.organization.plan,
      score: h.score,
      segment: h.segment,
      loginFrequency: h.loginFrequency,
      activeFunnels: h.activeFunnels,
      featuresUsed: h.featuresUsed,
      activeMembers: h.activeMembers,
      daysSinceLastSync: h.daysSinceLastSync,
      lastCalculatedAt: h.lastCalculatedAt,
    }))
  }),

  // Get segment summary (admin only)
  summary: adminProcedure.query(async ({ ctx }) => {
    const segments = await ctx.db
      .select({
        segment: customerHealth.segment,
        count: sql<number>`count(*)`,
        avgScore: sql<number>`avg(${customerHealth.score})`,
      })
      .from(customerHealth)
      .groupBy(customerHealth.segment)

    return {
      purple: segments.find(s => s.segment === 'purple') ?? { segment: 'purple', count: 0, avgScore: 0 },
      green: segments.find(s => s.segment === 'green') ?? { segment: 'green', count: 0, avgScore: 0 },
      yellow: segments.find(s => s.segment === 'yellow') ?? { segment: 'yellow', count: 0, avgScore: 0 },
      red: segments.find(s => s.segment === 'red') ?? { segment: 'red', count: 0, avgScore: 0 },
    }
  }),
})
