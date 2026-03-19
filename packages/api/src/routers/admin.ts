import { router, adminProcedure, z } from '../trpc.js'
import {
  organizations,
  organizationMembers,
  funnels,
  integrations,
  syncJobs,
  monthlyUsageSummary,
  eq,
  desc,
  and,
  gte,
} from '@funnlio/db'

export const adminRouter = router({
  // ─── Overview da plataforma ───────────────────────────────────────────────
  overview: adminProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [orgsCount, recentJobs] = await Promise.all([
      ctx.db.select().from(organizations),
      ctx.db.query.syncJobs.findMany({
        orderBy: [desc(syncJobs.createdAt)],
        limit: 100,
      }),
    ])

    const successJobs = recentJobs.filter((j) => j.status === 'success').length
    const failedJobs = recentJobs.filter((j) => j.status === 'failed').length
    const totalJobs = recentJobs.length
    const errorRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0

    return {
      totalOrganizations: orgsCount.length,
      activeOrganizations: orgsCount.filter((o) => o.plan !== 'trial').length,
      jobsLast24h: {
        total: totalJobs,
        success: successJobs,
        failed: failedJobs,
        errorRate: Math.round(errorRate * 10) / 10,
      },
    }
  }),

  // ─── Lista de organizações (clientes) ─────────────────────────────────────
  listOrganizations: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const orgs = await ctx.db.query.organizations.findMany({
        orderBy: [desc(organizations.createdAt)],
        limit: input.limit,
        offset: input.offset,
        with: {
          members: true,
        },
      })

      // Para cada org, contar funis e integrações
      const orgsWithStats = await Promise.all(
        orgs.map(async (org) => {
          const [orgFunnels, orgIntegrations, recentJobs] = await Promise.all([
            ctx.db.select().from(funnels).where(eq(funnels.organizationId, org.id)),
            ctx.db.select().from(integrations).where(eq(integrations.organizationId, org.id)),
            ctx.db.query.syncJobs.findMany({
              where: and(
                eq(syncJobs.organizationId, org.id),
                gte(syncJobs.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
              ),
              orderBy: [desc(syncJobs.createdAt)],
            }),
          ])

          const failedJobsCount = recentJobs.filter((j) => j.status === 'failed').length
          const errorRate = recentJobs.length > 0 ? failedJobsCount / recentJobs.length : 0
          const health =
            errorRate > 0.5 ? 'critical' : errorRate > 0.2 ? 'warning' : 'healthy'

          return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            plan: org.plan,
            planExpiresAt: org.planExpiresAt,
            createdAt: org.createdAt,
            funnelsCount: orgFunnels.length,
            integrationsCount: orgIntegrations.length,
            usersCount: org.members.length,
            health: { status: health, errorRate: Math.round(errorRate * 100) },
          }
        })
      )

      return orgsWithStats
    }),

  // ─── Detalhe de uma organização ───────────────────────────────────────────
  getOrganization: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, input.id),
        with: {
          members: {
            with: { user: true },
          },
        },
      })

      if (!org) return null

      const [orgFunnels, orgIntegrations] = await Promise.all([
        ctx.db.query.funnels.findMany({
          where: eq(funnels.organizationId, org.id),
          orderBy: [desc(funnels.createdAt)],
        }),
        ctx.db.query.integrations.findMany({
          where: eq(integrations.organizationId, org.id),
          with: { provider: true },
        }),
      ])

      return {
        ...org,
        funnels: orgFunnels,
        integrations: orgIntegrations.map(({ credentials: _c, ...i }) => i),
      }
    }),

  // ─── Alterar plano de uma organização ─────────────────────────────────────
  updatePlan: adminProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        plan: z.enum(['trial', 'starter', 'pro', 'enterprise']),
        expiresAt: z.string().datetime().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(organizations)
        .set({
          plan: input.plan,
          planExpiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, input.organizationId))
        .returning()

      return updated
    }),

  // ─── Jobs recentes de todas as orgs ───────────────────────────────────────
  listJobs: adminProcedure
    .input(
      z.object({
        status: z.enum(['queued', 'running', 'success', 'failed', 'cancelled']).optional(),
        limit: z.number().min(1).max(200).default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const jobs = await ctx.db.query.syncJobs.findMany({
        where: input.status ? eq(syncJobs.status, input.status) : undefined,
        orderBy: [desc(syncJobs.createdAt)],
        limit: input.limit,
        with: {
          organization: true,
          integration: {
            with: { provider: true },
          },
        },
      })

      return jobs
    }),
})
