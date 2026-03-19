import { TRPCError, router, protectedProcedure, ownerAdminProcedure, z } from '../trpc.js'
import {
  funnels,
  funnelStages,
  stageMetricConfigs,
  eq,
  and,
  asc,
  sql,
} from '@funnlio/db'

export const stagesRouter = router({
  // ─── Criar etapa ──────────────────────────────────────────────────────────
  create: ownerAdminProcedure
    .input(
      z.object({
        funnelId: z.string().uuid(),
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        integrationId: z.string().uuid().optional(),
        targetValue: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      // Verificar que o funil pertence à organização
      const funnel = await ctx.db.query.funnels.findFirst({
        where: and(
          eq(funnels.id, input.funnelId),
          eq(funnels.organizationId, organizationId)
        ),
        with: { stages: true },
      })

      if (!funnel) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Funil não encontrado' })
      }

      const nextPosition = funnel.stages.length + 1

      const [stage] = await ctx.db
        .insert(funnelStages)
        .values({
          funnelId: input.funnelId,
          name: input.name,
          description: input.description ?? null,
          position: nextPosition,
          integrationId: input.integrationId ?? null,
          targetValue: input.targetValue ? String(input.targetValue) : null,
        })
        .returning()

      return stage
    }),

  // ─── Atualizar etapa ──────────────────────────────────────────────────────
  update: ownerAdminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).nullable().optional(),
        integrationId: z.string().uuid().nullable().optional(),
        metricConfig: z.record(z.unknown()).optional(),
        targetValue: z.number().positive().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session
      const { id, targetValue, ...data } = input

      // Verificar propriedade via join com funnel
      const stage = await ctx.db.query.funnelStages.findFirst({
        where: eq(funnelStages.id, id),
        with: { funnel: true },
      })

      if (!stage || stage.funnel.organizationId !== organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Etapa não encontrada' })
      }

      const [updated] = await ctx.db
        .update(funnelStages)
        .set({
          ...data,
          targetValue: targetValue != null ? String(targetValue) : null,
          updatedAt: new Date(),
        })
        .where(eq(funnelStages.id, id))
        .returning()

      return updated
    }),

  // ─── Reordenar etapas (drag & drop) ───────────────────────────────────────
  reorder: ownerAdminProcedure
    .input(
      z.object({
        funnelId: z.string().uuid(),
        // Array de IDs na nova ordem
        stageIds: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      const funnel = await ctx.db.query.funnels.findFirst({
        where: and(eq(funnels.id, input.funnelId), eq(funnels.organizationId, organizationId)),
      })

      if (!funnel) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Funil não encontrado' })
      }

      // Atualizar posições em batch
      await Promise.all(
        input.stageIds.map((stageId, index) =>
          ctx.db
            .update(funnelStages)
            .set({ position: index + 1 })
            .where(and(eq(funnelStages.id, stageId), eq(funnelStages.funnelId, input.funnelId)))
        )
      )

      return { success: true }
    }),

  // ─── Deletar etapa ────────────────────────────────────────────────────────
  delete: ownerAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      const stage = await ctx.db.query.funnelStages.findFirst({
        where: eq(funnelStages.id, input.id),
        with: { funnel: true },
      })

      if (!stage || stage.funnel.organizationId !== organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Etapa não encontrada' })
      }

      await ctx.db.delete(funnelStages).where(eq(funnelStages.id, input.id))

      // Renumerar posições das etapas restantes
      const remainingStages = await ctx.db.query.funnelStages.findMany({
        where: eq(funnelStages.funnelId, stage.funnelId),
        orderBy: [asc(funnelStages.position)],
      })

      await Promise.all(
        remainingStages.map((s, index) =>
          ctx.db
            .update(funnelStages)
            .set({ position: index + 1 })
            .where(eq(funnelStages.id, s.id))
        )
      )

      return { success: true }
    }),

  // ─── Configurar métricas da etapa ─────────────────────────────────────────
  setMetrics: ownerAdminProcedure
    .input(
      z.object({
        stageId: z.string().uuid(),
        metrics: z.array(
          z.object({
            metricKey: z.string(),
            label: z.string(),
            metricType: z.enum(['number', 'currency', 'percentage', 'duration']),
            isPrimary: z.boolean().default(false),
            aggregation: z.enum(['sum', 'avg', 'last', 'min', 'max']).default('sum'),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      const stage = await ctx.db.query.funnelStages.findFirst({
        where: eq(funnelStages.id, input.stageId),
        with: { funnel: true },
      })

      if (!stage || stage.funnel.organizationId !== organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Etapa não encontrada' })
      }

      // Apagar métricas existentes e recriar
      await ctx.db.delete(stageMetricConfigs).where(eq(stageMetricConfigs.stageId, input.stageId))

      if (input.metrics.length > 0) {
        await ctx.db.insert(stageMetricConfigs).values(
          input.metrics.map((m) => ({
            stageId: input.stageId,
            metricKey: m.metricKey,
            label: m.label,
            metricType: m.metricType,
            isPrimary: m.isPrimary ? 1 : 0,
            aggregation: m.aggregation,
          }))
        )
      }

      return { success: true }
    }),
})
