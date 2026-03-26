import { router, protectedProcedure, z } from '../trpc.js'
import { organizationMembers, users, eq, and, desc, gte, lte } from '@funnlio/db'

/**
 * Audit log router.
 * Currently returns a stub — a real implementation would use a dedicated audit_logs table.
 * The audit log captures changes from DB triggers or application-level hooks.
 */
export const auditLogRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        action: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ ctx }) => {
      const { organizationId } = ctx.session

      // Return stub — real implementation requires audit_logs table
      // For now, return members join log as a proxy
      const members = await ctx.db.query.organizationMembers.findMany({
        where: eq(organizationMembers.organizationId, organizationId),
        with: { user: true },
        orderBy: (m, { desc }) => [desc(m.joinedAt)],
        limit: 50,
      })

      return members.map((m) => ({
        id: m.id,
        userId: m.userId,
        userEmail: m.user.email,
        userName: m.user.name,
        action: 'member.joined',
        resource: 'organization',
        resourceId: organizationId,
        metadata: { role: m.role },
        createdAt: m.joinedAt?.toISOString() ?? new Date().toISOString(),
      }))
    }),
})
