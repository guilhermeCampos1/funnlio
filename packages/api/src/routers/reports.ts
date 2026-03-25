import { router, protectedProcedure, ownerAdminProcedure, z, TRPCError } from '../trpc.js'
import { reportSettings, eq, and, organizations } from '@funnlio/db'
import { hasFeatureAccess } from '@funnlio/shared'
import type { Plan } from '@funnlio/shared'

export const reportsRouter = router({
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const { organizationId } = ctx.session
    const settings = await ctx.db.query.reportSettings.findMany({
      where: eq(reportSettings.organizationId, organizationId),
    })
    return settings
  }),

  upsertSetting: ownerAdminProcedure
    .input(z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      enabled: z.boolean(),
      recipients: z.array(z.string().email()),
      includeInsights: z.boolean().optional(),
      includeMetrics: z.boolean().optional(),
      sendTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      // Check feature access
      const org = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
      })
      if (!org) throw new TRPCError({ code: 'NOT_FOUND' })

      const plan = org.plan as Plan
      const trialExpired = plan === 'trial' && org.planExpiresAt && new Date(org.planExpiresAt) < new Date()

      // Monthly reports are Pro+
      if (input.frequency === 'monthly' && !hasFeatureAccess(plan, 'monthly_report', !!trialExpired)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Relatório mensal requer plano Pro' })
      }

      // Weekly reports are Starter+
      if (!hasFeatureAccess(plan, 'weekly_report', !!trialExpired)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Relatórios requerem plano Starter' })
      }

      const existing = await ctx.db.query.reportSettings.findFirst({
        where: and(
          eq(reportSettings.organizationId, organizationId),
          eq(reportSettings.frequency, input.frequency)
        ),
      })

      if (existing) {
        await ctx.db.update(reportSettings).set({
          enabled: input.enabled,
          recipients: input.recipients,
          includeInsights: input.includeInsights ?? existing.includeInsights,
          includeMetrics: input.includeMetrics ?? existing.includeMetrics,
          sendTime: input.sendTime ?? existing.sendTime,
          updatedAt: new Date(),
        }).where(eq(reportSettings.id, existing.id))
      } else {
        await ctx.db.insert(reportSettings).values({
          organizationId,
          frequency: input.frequency,
          enabled: input.enabled,
          recipients: input.recipients,
          includeInsights: input.includeInsights ?? true,
          includeMetrics: input.includeMetrics ?? true,
          sendTime: input.sendTime ?? '08:00',
        })
      }

      return { success: true }
    }),
})
