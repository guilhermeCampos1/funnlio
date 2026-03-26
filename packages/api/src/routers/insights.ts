import { router, protectedProcedure, z } from '../trpc.js'
import { insights, eq, and, desc, isNull, sql } from '@funnlio/db'

export const insightsRouter = router({
  // Get recent insights for org (dashboard card)
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(5),
      unreadOnly: z.boolean().default(false),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { organizationId } = ctx.session
      const limit = input?.limit ?? 5
      const unreadOnly = input?.unreadOnly ?? false

      const conditions = [eq(insights.organizationId, organizationId)]
      if (unreadOnly) {
        conditions.push(isNull(insights.readAt))
      }

      const rows = await ctx.db.query.insights.findMany({
        where: and(...conditions),
        orderBy: [desc(insights.createdAt)],
        limit,
      })

      return rows
    }),

  // Count unread insights (for badge)
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const { organizationId } = ctx.session
    const result = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(insights)
      .where(and(
        eq(insights.organizationId, organizationId),
        isNull(insights.readAt)
      ))
    return result[0]?.count ?? 0
  }),

  // Mark insight as read
  markRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session
      await ctx.db
        .update(insights)
        .set({ readAt: new Date() })
        .where(and(
          eq(insights.id, input.id),
          eq(insights.organizationId, organizationId)
        ))
      return { success: true }
    }),

  // Mark all as read
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const { organizationId } = ctx.session
    await ctx.db
      .update(insights)
      .set({ readAt: new Date() })
      .where(and(
        eq(insights.organizationId, organizationId),
        isNull(insights.readAt)
      ))
    return { success: true }
  }),
})
