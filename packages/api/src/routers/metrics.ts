import { TRPCError, router, protectedProcedure, z } from '../trpc.js'
import {
  funnels,
  funnelStages,
  metricSnapshots,
  syncJobs,
  integrations,
  eq,
  and,
  desc,
  gte,
  lte,
} from '@funnlio/db'
import { getDateRange } from '@funnlio/shared'

export const metricsRouter = router({
  // ─── Snapshots de uma etapa para um período ───────────────────────────────
  getStageHistory: protectedProcedure
    .input(
      z.object({
        stageId: z.string().uuid(),
        preset: z.enum(['today', 'yesterday', 'last7d', 'last30d', 'last90d']).default('last30d'),
      })
    )
    .query(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      // Verificar propriedade
      const stage = await ctx.db.query.funnelStages.findFirst({
        where: eq(funnelStages.id, input.stageId),
        with: { funnel: true },
      })

      if (!stage || stage.funnel.organizationId !== organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Etapa não encontrada' })
      }

      const { start, end } = getDateRange(input.preset)

      const snapshots = await ctx.db.query.metricSnapshots.findMany({
        where: and(
          eq(metricSnapshots.stageId, input.stageId),
          gte(metricSnapshots.collectedAt, start),
          lte(metricSnapshots.collectedAt, end)
        ),
        orderBy: [desc(metricSnapshots.collectedAt)],
      })

      return snapshots.map((s) => ({
        id: s.id,
        collectedAt: s.collectedAt,
        dateRangeStart: s.dateRangeStart,
        dateRangeEnd: s.dateRangeEnd,
        data: s.data as Record<string, number>,
      }))
    }),

  // ─── Disparar sync manual de uma etapa ────────────────────────────────────
  triggerSync: protectedProcedure
    .input(
      z.object({
        stageId: z.string().uuid(),
        dateRange: z.object({
          start: z.string().datetime(),
          end: z.string().datetime(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      const stage = await ctx.db.query.funnelStages.findFirst({
        where: eq(funnelStages.id, input.stageId),
        with: {
          funnel: true,
          integration: true,
        },
      })

      if (!stage || stage.funnel.organizationId !== organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Etapa não encontrada' })
      }

      if (!stage.integration) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Esta etapa não tem uma integração configurada',
        })
      }

      // Criar job de sync no banco (o worker vai processar via polling ou queue)
      const [job] = await ctx.db
        .insert(syncJobs)
        .values({
          organizationId,
          integrationId: stage.integrationId,
          stageId: input.stageId,
          status: 'queued',
          trigger: 'manual',
          metadata: {
            dateRange: input.dateRange ?? null,
            requestedAt: new Date().toISOString(),
          },
        })
        .returning()

      return { jobId: job.id, status: job.status }
    }),

  // ─── Status de um job de sync ─────────────────────────────────────────────
  getSyncStatus: protectedProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      const job = await ctx.db.query.syncJobs.findFirst({
        where: and(
          eq(syncJobs.id, input.jobId),
          eq(syncJobs.organizationId, organizationId)
        ),
      })

      if (!job) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Job não encontrado' })
      }

      return {
        id: job.id,
        status: job.status,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        error: job.error,
      }
    }),
})
