import { router, protectedProcedure, ownerAdminProcedure, z, TRPCError } from '../trpc.js'
import { alertSettings, eq, and } from '@funnlio/db'

export const alertsRouter = router({
  // Get alert settings for org
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const { organizationId } = ctx.session
    const settings = await ctx.db.query.alertSettings.findMany({
      where: eq(alertSettings.organizationId, organizationId),
    })

    // If no settings exist, return defaults
    const defaultTypes = [
      'conversion_drop',
      'conversion_spike',
      'spend_anomaly',
      'sync_failed',
      'integration_error',
    ]

    if (settings.length === 0) {
      return defaultTypes.map(type => ({
        alertType: type,
        enabled: true,
        emailEnabled: true,
        slackEnabled: false,
      }))
    }

    return settings
  }),

  // Update alert setting
  updateSetting: ownerAdminProcedure
    .input(z.object({
      alertType: z.string(),
      enabled: z.boolean().optional(),
      emailEnabled: z.boolean().optional(),
      slackEnabled: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      // Upsert
      const existing = await ctx.db.query.alertSettings.findFirst({
        where: and(
          eq(alertSettings.organizationId, organizationId),
          eq(alertSettings.alertType, input.alertType)
        ),
      })

      if (existing) {
        await ctx.db
          .update(alertSettings)
          .set({
            enabled: input.enabled ?? existing.enabled,
            emailEnabled: input.emailEnabled ?? existing.emailEnabled,
            slackEnabled: input.slackEnabled ?? existing.slackEnabled,
            updatedAt: new Date(),
          })
          .where(eq(alertSettings.id, existing.id))
      } else {
        await ctx.db.insert(alertSettings).values({
          organizationId,
          alertType: input.alertType,
          enabled: input.enabled ?? true,
          emailEnabled: input.emailEnabled ?? true,
          slackEnabled: input.slackEnabled ?? false,
        })
      }

      return { success: true }
    }),
})
