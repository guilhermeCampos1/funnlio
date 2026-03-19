import { TRPCError, router, protectedProcedure, ownerAdminProcedure, z } from '../trpc.js'
import {
  funnels,
  funnelStages,
  stageMetricConfigs,
  metricSnapshots,
  eq,
  and,
  desc,
  asc,
} from '@funnlio/db'
import { calculateConversionRate, slugify } from '@funnlio/shared'

export const funnelsRouter = router({
  // ─── Listar todos os funis da organização ──────────────────────────────────
  list: protectedProcedure.query(async ({ ctx }) => {
    const { organizationId } = ctx.session

    const rows = await ctx.db.query.funnels.findMany({
      where: eq(funnels.organizationId, organizationId),
      with: {
        stages: {
          orderBy: [asc(funnelStages.position)],
          with: {
            snapshots: {
              orderBy: [desc(metricSnapshots.collectedAt)],
              limit: 1,
            },
          },
        },
      },
      orderBy: [desc(funnels.createdAt)],
    })

    return rows.map((funnel) => ({
      id: funnel.id,
      name: funnel.name,
      description: funnel.description,
      status: funnel.status,
      color: funnel.color,
      stageCount: funnel.stages.length,
      lastSyncedAt: funnel.stages
        .flatMap((s) => s.snapshots)
        .sort((a, b) => b.collectedAt.getTime() - a.collectedAt.getTime())[0]?.collectedAt ?? null,
      createdAt: funnel.createdAt,
    }))
  }),

  // ─── Detalhe de um funil com todas as etapas e métricas ────────────────────
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      const funnel = await ctx.db.query.funnels.findFirst({
        where: and(eq(funnels.id, input.id), eq(funnels.organizationId, organizationId)),
        with: {
          stages: {
            orderBy: [asc(funnelStages.position)],
            with: {
              integration: {
                with: { provider: true },
              },
              metricConfigs: true,
              snapshots: {
                orderBy: [desc(metricSnapshots.collectedAt)],
                limit: 1,
              },
            },
          },
        },
      })

      if (!funnel) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Funil não encontrado' })
      }

      // Calcular taxas de conversão entre etapas
      const stagesWithConversion = funnel.stages.map((stage, index) => {
        const latestSnapshot = stage.snapshots[0]
        const primaryMetricConfig = stage.metricConfigs.find((c) => c.isPrimary === 1)

        const currentValue = primaryMetricConfig && latestSnapshot
          ? (latestSnapshot.data as Record<string, number>)[primaryMetricConfig.metricKey] ?? null
          : null

        const previousStage = index > 0 ? funnel.stages[index - 1] : null
        const previousSnapshot = previousStage?.snapshots[0]
        const previousPrimaryMetric = previousStage?.metricConfigs.find((c) => c.isPrimary === 1)
        const previousValue = previousPrimaryMetric && previousSnapshot
          ? (previousSnapshot.data as Record<string, number>)[previousPrimaryMetric.metricKey] ?? null
          : null

        return {
          id: stage.id,
          name: stage.name,
          description: stage.description,
          position: stage.position,
          integration: stage.integration
            ? {
                id: stage.integration.id,
                name: stage.integration.name,
                providerSlug: stage.integration.provider.slug,
                providerName: stage.integration.provider.name,
                status: stage.integration.status,
              }
            : null,
          metrics: stage.metricConfigs.map((config) => ({
            key: config.metricKey,
            label: config.label,
            type: config.metricType,
            isPrimary: config.isPrimary === 1,
            value: latestSnapshot
              ? (latestSnapshot.data as Record<string, number>)[config.metricKey] ?? null
              : null,
          })),
          conversionRateFromPrevious: calculateConversionRate(previousValue, currentValue),
          targetValue: stage.targetValue ? Number(stage.targetValue) : null,
          lastSyncedAt: latestSnapshot?.collectedAt ?? null,
        }
      })

      return {
        id: funnel.id,
        name: funnel.name,
        description: funnel.description,
        status: funnel.status,
        color: funnel.color,
        createdAt: funnel.createdAt,
        updatedAt: funnel.updatedAt,
        stages: stagesWithConversion,
      }
    }),

  // ─── Criar funil ──────────────────────────────────────────────────────────
  create: ownerAdminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId, userId } = ctx.session

      const [funnel] = await ctx.db
        .insert(funnels)
        .values({
          organizationId,
          name: input.name,
          description: input.description ?? null,
          color: input.color ?? null,
          createdBy: userId,
        })
        .returning()

      return funnel
    }),

  // ─── Atualizar funil ──────────────────────────────────────────────────────
  update: ownerAdminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).nullable().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
        status: z.enum(['active', 'paused', 'archived']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session
      const { id, ...data } = input

      const [updated] = await ctx.db
        .update(funnels)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(funnels.id, id), eq(funnels.organizationId, organizationId)))
        .returning()

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Funil não encontrado' })
      }
      return updated
    }),

  // ─── Deletar funil ────────────────────────────────────────────────────────
  delete: ownerAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      const [deleted] = await ctx.db
        .delete(funnels)
        .where(and(eq(funnels.id, input.id), eq(funnels.organizationId, organizationId)))
        .returning()

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Funil não encontrado' })
      }
      return { success: true }
    }),
})
