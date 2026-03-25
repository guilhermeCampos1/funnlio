import { router, protectedProcedure, z, TRPCError } from '../trpc.js'
import { benchmarks, organizationVerticals, eq, and, organizations } from '@funnlio/db'
import { hasFeatureAccess } from '@funnlio/shared'
import type { Plan } from '@funnlio/shared'

export const benchmarksRouter = router({
  // Get benchmarks for org's vertical
  getForVertical: protectedProcedure.query(async ({ ctx }) => {
    const { organizationId } = ctx.session

    // Check feature gate
    const org = await ctx.db.query.organizations.findFirst({ where: eq(organizations.id, organizationId) })
    if (!org) throw new TRPCError({ code: 'NOT_FOUND' })
    const plan = org.plan as Plan
    const trialExpired = plan === 'trial' && org.planExpiresAt && new Date(org.planExpiresAt) < new Date()
    if (!hasFeatureAccess(plan, 'benchmarks', !!trialExpired)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Benchmarks requerem plano Pro' })
    }

    // Get org vertical
    const verticalSetting = await ctx.db.query.organizationVerticals.findFirst({
      where: eq(organizationVerticals.organizationId, organizationId),
    })

    if (!verticalSetting) return { vertical: null, benchmarks: [] }

    const results = await ctx.db.query.benchmarks.findMany({
      where: eq(benchmarks.vertical, verticalSetting.vertical),
    })

    return { vertical: verticalSetting.vertical, benchmarks: results }
  }),

  // Set org vertical
  setVertical: protectedProcedure
    .input(z.object({ vertical: z.enum(['ecommerce', 'infoproduto', 'saas', 'servico', 'agencia', 'other']) }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      const existing = await ctx.db.query.organizationVerticals.findFirst({
        where: eq(organizationVerticals.organizationId, organizationId),
      })

      if (existing) {
        await ctx.db.update(organizationVerticals).set({ vertical: input.vertical }).where(eq(organizationVerticals.id, existing.id))
      } else {
        await ctx.db.insert(organizationVerticals).values({ organizationId, vertical: input.vertical })
      }

      return { success: true }
    }),
})
