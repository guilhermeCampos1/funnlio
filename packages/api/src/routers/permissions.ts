import { router, ownerAdminProcedure, z, TRPCError } from '../trpc.js'
import { memberPermissions, organizationMembers, eq, and } from '@funnlio/db'

export const permissionsRouter = router({
  list: ownerAdminProcedure.query(async ({ ctx }) => {
    const { organizationId } = ctx.session
    return ctx.db.query.memberPermissions.findMany({
      where: eq(memberPermissions.organizationId, organizationId),
      with: { user: true },
    })
  }),

  update: ownerAdminProcedure
    .input(z.object({
      userId: z.string(),
      permission: z.enum(['viewer', 'editor', 'admin']),
    }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      // Verify user is member
      const member = await ctx.db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, input.userId)
        ),
      })
      if (!member) throw new TRPCError({ code: 'NOT_FOUND' })

      // Upsert permission
      const existing = await ctx.db.query.memberPermissions.findFirst({
        where: and(
          eq(memberPermissions.organizationId, organizationId),
          eq(memberPermissions.userId, input.userId)
        ),
      })

      if (existing) {
        await ctx.db.update(memberPermissions).set({
          permission: input.permission,
          updatedAt: new Date(),
        }).where(eq(memberPermissions.id, existing.id))
      } else {
        await ctx.db.insert(memberPermissions).values({
          organizationId,
          userId: input.userId,
          permission: input.permission,
        })
      }

      return { success: true }
    }),
})
