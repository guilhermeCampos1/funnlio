import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'
import { eq, organizations } from '@funnlio/db'
import type { Database } from '@funnlio/db'
import { getEffectivePlanLimits } from '@funnlio/shared'
import type { Plan } from '@funnlio/shared'

// ─── Context ──────────────────────────────────────────────────────────────────

export interface TRPCContext {
  db: Database
  sessionId: string | null
  session: {
    userId: string
    organizationId: string
    orgRole: 'owner' | 'admin' | 'viewer'
    userRole: 'saas_admin' | 'member'
  } | null
}

// ─── tRPC init ────────────────────────────────────────────────────────────────

const t = initTRPC.context<TRPCContext>().create()

export const router = t.router
export const publicProcedure = t.procedure

// ─── Middlewares ──────────────────────────────────────────────────────────────

const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, session: ctx.session } })
})

const enforceAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  if (ctx.session.userRole !== 'saas_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administradores do SaaS' })
  }
  return next({ ctx: { ...ctx, session: ctx.session } })
})

const enforceOrgOwnerOrAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  if (!['owner', 'admin'].includes(ctx.session.orgRole)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas owners e admins podem realizar esta ação' })
  }
  return next({ ctx: { ...ctx, session: ctx.session } })
})

// ─── Plan Limit Middleware Factory ────────────────────────────────────────────

type LimitResource = 'maxFunnels' | 'maxIntegrations' | 'maxMembers'

export function createPlanLimitMiddleware(
  resource: LimitResource,
  getCurrentCount: (ctx: { db: Database; organizationId: string }) => Promise<number>,
) {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.session) throw new TRPCError({ code: 'UNAUTHORIZED' })

    const org = await ctx.db.query.organizations.findFirst({
      where: eq(organizations.id, ctx.session.organizationId),
      columns: { plan: true, planExpiresAt: true },
    })

    if (!org) throw new TRPCError({ code: 'NOT_FOUND', message: 'Organização não encontrada' })

    const plan = org.plan as Plan
    const trialExpired = org.planExpiresAt ? new Date(org.planExpiresAt) <= new Date() : true
    const limits = getEffectivePlanLimits(plan, trialExpired)
    const limit = limits[resource]

    if (isFinite(limit)) {
      const current = await getCurrentCount({ db: ctx.db, organizationId: ctx.session.organizationId })
      if (current >= limit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `PLAN_LIMIT_REACHED:${resource}:${current}:${limit}:${plan}`,
        })
      }
    }

    return next({ ctx })
  })
}

// ─── Procedures ───────────────────────────────────────────────────────────────

export const protectedProcedure = t.procedure.use(enforceAuth)
export const adminProcedure = t.procedure.use(enforceAdmin)
export const ownerAdminProcedure = t.procedure.use(enforceAuth).use(enforceOrgOwnerOrAdmin)

export { z, TRPCError }
