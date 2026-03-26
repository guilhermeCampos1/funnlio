import { router, ownerAdminProcedure, z, TRPCError } from '../trpc.js'
import { apiKeys, eq, and, organizations } from '@funnlio/db'
import { hasFeatureAccess } from '@funnlio/shared'
import type { Plan } from '@funnlio/shared'
import crypto from 'node:crypto'

export const apiKeysRouter = router({
  list: ownerAdminProcedure.query(async ({ ctx }) => {
    const { organizationId } = ctx.session
    const keys = await ctx.db.query.apiKeys.findMany({
      where: eq(apiKeys.organizationId, organizationId),
    })
    return keys.map(k => ({ ...k, keyHash: undefined })) // Never expose hash
  }),

  create: ownerAdminProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      // Feature gate
      const org = await ctx.db.query.organizations.findFirst({ where: eq(organizations.id, organizationId) })
      if (!org) throw new TRPCError({ code: 'NOT_FOUND' })
      const plan = org.plan as Plan
      const trialExpired = plan === 'trial' && org.planExpiresAt && new Date(org.planExpiresAt) < new Date()
      if (!hasFeatureAccess(plan, 'api', !!trialExpired)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'API requer plano Enterprise' })
      }

      // Generate key
      const rawKey = `funnlio_${crypto.randomBytes(32).toString('hex')}`
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
      const keyPrefix = rawKey.slice(0, 16)

      const [key] = await ctx.db.insert(apiKeys).values({
        organizationId,
        name: input.name,
        keyHash,
        keyPrefix,
      }).returning()

      // Return the raw key only once - it can never be retrieved again
      return { ...key, rawKey, keyHash: undefined }
    }),

  revoke: ownerAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session
      await ctx.db.update(apiKeys).set({ isActive: false }).where(
        and(eq(apiKeys.id, input.id), eq(apiKeys.organizationId, organizationId))
      )
      return { success: true }
    }),
})
