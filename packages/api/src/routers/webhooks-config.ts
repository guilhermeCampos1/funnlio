import { router, ownerAdminProcedure, z, TRPCError } from '../trpc.js'
import { webhookConfigs, webhookLogs, eq, and, desc, organizations } from '@funnlio/db'
import { hasFeatureAccess } from '@funnlio/shared'
import type { Plan } from '@funnlio/shared'
import crypto from 'node:crypto'

export const webhooksConfigRouter = router({
  list: ownerAdminProcedure.query(async ({ ctx }) => {
    const { organizationId } = ctx.session
    return ctx.db.query.webhookConfigs.findMany({
      where: eq(webhookConfigs.organizationId, organizationId),
    })
  }),

  create: ownerAdminProcedure
    .input(z.object({
      url: z.string().url(),
      events: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      const org = await ctx.db.query.organizations.findFirst({ where: eq(organizations.id, organizationId) })
      if (!org) throw new TRPCError({ code: 'NOT_FOUND' })
      const plan = org.plan as Plan
      const trialExpired = plan === 'trial' && org.planExpiresAt && new Date(org.planExpiresAt) < new Date()
      if (!hasFeatureAccess(plan, 'webhooks', !!trialExpired)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Webhooks requerem plano Enterprise' })
      }

      const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`
      const [config] = await ctx.db.insert(webhookConfigs).values({
        organizationId,
        url: input.url,
        secret,
        events: JSON.stringify(input.events),
      }).returning()

      return { ...config, secret }
    }),

  delete: ownerAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session
      await ctx.db.delete(webhookConfigs).where(
        and(eq(webhookConfigs.id, input.id), eq(webhookConfigs.organizationId, organizationId))
      )
      return { success: true }
    }),

  getLogs: ownerAdminProcedure
    .input(z.object({ webhookId: z.string().uuid(), limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.webhookLogs.findMany({
        where: eq(webhookLogs.webhookConfigId, input.webhookId),
        orderBy: [desc(webhookLogs.createdAt)],
        limit: input.limit,
      })
    }),
})
