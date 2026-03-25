import { router, protectedProcedure, z, TRPCError } from '../trpc.js'
import { comments, eq, and, desc, organizations } from '@funnlio/db'
import { hasFeatureAccess } from '@funnlio/shared'
import type { Plan } from '@funnlio/shared'

export const commentsRouter = router({
  list: protectedProcedure
    .input(z.object({ stageId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { organizationId } = ctx.session
      const rows = await ctx.db.query.comments.findMany({
        where: and(
          eq(comments.organizationId, organizationId),
          eq(comments.stageId, input.stageId)
        ),
        with: { user: true },
        orderBy: [desc(comments.createdAt)],
      })
      return rows.map(c => ({
        id: c.id,
        content: c.content,
        userName: c.user?.name ?? c.user?.email ?? 'Usuário',
        userImage: c.user?.image,
        createdAt: c.createdAt,
      }))
    }),

  create: protectedProcedure
    .input(z.object({
      stageId: z.string().uuid(),
      content: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId, userId } = ctx.session

      // Check feature gate
      const org = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
      })
      if (!org) throw new TRPCError({ code: 'NOT_FOUND' })
      const plan = org.plan as Plan
      const trialExpired = plan === 'trial' && org.planExpiresAt && new Date(org.planExpiresAt) < new Date()
      if (!hasFeatureAccess(plan, 'comments', !!trialExpired)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Comentários requerem plano Pro' })
      }

      const [comment] = await ctx.db.insert(comments).values({
        organizationId,
        stageId: input.stageId,
        userId,
        content: input.content,
      }).returning()

      return comment
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId, userId } = ctx.session
      const comment = await ctx.db.query.comments.findFirst({
        where: and(eq(comments.id, input.id), eq(comments.organizationId, organizationId)),
      })
      if (!comment) throw new TRPCError({ code: 'NOT_FOUND' })
      if (comment.userId !== userId) throw new TRPCError({ code: 'FORBIDDEN' })
      await ctx.db.delete(comments).where(eq(comments.id, input.id))
      return { success: true }
    }),
})
