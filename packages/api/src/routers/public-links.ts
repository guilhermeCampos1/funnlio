import { router, protectedProcedure, ownerAdminProcedure, publicProcedure, z, TRPCError } from '../trpc.js'
import { publicLinks, funnels, organizations, eq, and } from '@funnlio/db'
import { hasFeatureAccess } from '@funnlio/shared'
import type { Plan } from '@funnlio/shared'
import crypto from 'node:crypto'

export const publicLinksRouter = router({
  // Create a public link for a funnel
  create: ownerAdminProcedure
    .input(z.object({
      funnelId: z.string().uuid(),
      expiresInDays: z.number().min(1).max(365).optional(),
      password: z.string().min(4).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      // Feature gate
      const org = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
      })
      if (!org) throw new TRPCError({ code: 'NOT_FOUND' })
      const plan = org.plan as Plan
      const trialExpired = plan === 'trial' && org.planExpiresAt && new Date(org.planExpiresAt) < new Date()
      if (!hasFeatureAccess(plan, 'public_link', !!trialExpired)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Link público requer plano Pro' })
      }

      // Verify funnel belongs to org
      const funnel = await ctx.db.query.funnels.findFirst({
        where: and(eq(funnels.id, input.funnelId), eq(funnels.organizationId, organizationId)),
      })
      if (!funnel) throw new TRPCError({ code: 'NOT_FOUND' })

      const token = crypto.randomBytes(24).toString('hex')
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null

      const [link] = await ctx.db.insert(publicLinks).values({
        organizationId,
        funnelId: input.funnelId,
        token,
        expiresAt,
        password: input.password ?? null,
        showBranding: plan !== 'enterprise',
      }).returning()

      return { ...link, url: `/public/${token}` }
    }),

  // List public links for a funnel
  list: protectedProcedure
    .input(z.object({ funnelId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { organizationId } = ctx.session
      const links = await ctx.db.query.publicLinks.findMany({
        where: and(
          eq(publicLinks.organizationId, organizationId),
          eq(publicLinks.funnelId, input.funnelId)
        ),
      })
      return links
    }),

  // Deactivate a public link
  deactivate: ownerAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session
      await ctx.db.update(publicLinks).set({
        isActive: false,
        updatedAt: new Date(),
      }).where(and(eq(publicLinks.id, input.id), eq(publicLinks.organizationId, organizationId)))
      return { success: true }
    }),

  // View public dashboard (no auth required)
  view: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const link = await ctx.db.query.publicLinks.findFirst({
        where: and(eq(publicLinks.token, input.token), eq(publicLinks.isActive, true)),
        with: {
          funnel: {
            with: {
              stages: {
                with: {
                  metricConfigs: true,
                  snapshots: {
                    limit: 1,
                    orderBy: (s: { collectedAt: any }, { desc }: { desc: (col: any) => any }) => [desc(s.collectedAt)],
                  },
                },
                orderBy: (s: { position: any }, { asc }: { asc: (col: any) => any }) => [asc(s.position)],
              },
            },
          },
        },
      })

      if (!link) throw new TRPCError({ code: 'NOT_FOUND', message: 'Link não encontrado ou expirado' })

      // Check expiry
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Link expirado' })
      }

      // Increment view count
      await ctx.db.update(publicLinks).set({
        viewCount: link.viewCount + 1,
      }).where(eq(publicLinks.id, link.id))

      const funnel = link.funnel
      return {
        funnelName: funnel.name,
        showBranding: link.showBranding,
        stages: funnel.stages.map((stage: any) => ({
          name: stage.name,
          position: stage.position,
          metrics: stage.metricConfigs.map((config: any) => ({
            key: config.metricKey,
            label: config.label,
            value: (stage.snapshots[0]?.data as Record<string, number | null>)?.[config.metricKey] ?? null,
            type: config.metricType,
          })),
          lastSyncedAt: stage.snapshots[0]?.collectedAt ?? null,
        })),
      }
    }),
})
