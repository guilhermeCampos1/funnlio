import { router, ownerAdminProcedure, z, TRPCError } from '../trpc.js'
import { webhookConfigs, webhookLogs, eq, and, desc, organizations, sql } from '@funnlio/db'
import { getEffectivePlanLimits } from '@funnlio/shared'
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
      const limits = getEffectivePlanLimits(plan)

      // Check maxWebhooks limit
      if (limits.maxWebhooks === 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Webhooks estao disponiveis a partir do plano Starter. Faca upgrade para configurar webhooks.',
        })
      }

      const [{ count }] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(webhookConfigs)
        .where(eq(webhookConfigs.organizationId, organizationId))

      if (count >= limits.maxWebhooks) {
        const nextPlan = plan === 'starter' ? 'Pro (ate 4 webhooks)' : 'Enterprise (ilimitado)'
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Limite de ${limits.maxWebhooks} webhook(s) atingido no seu plano. Upgrade para ${nextPlan} para mais.`,
        })
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
