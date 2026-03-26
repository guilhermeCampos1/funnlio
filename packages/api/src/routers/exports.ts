import { router, protectedProcedure, z, TRPCError } from '../trpc.js'
import {
  eq,
  funnels,
  funnelStages,
  metricSnapshots,
  organizations,
  asc,
  desc,
} from '@funnlio/db'
import { hasFeatureAccess } from '@funnlio/shared'
import type { Plan } from '@funnlio/shared'

export const exportsRouter = router({
  // Export funnel data as CSV
  exportCSV: protectedProcedure
    .input(z.object({
      funnelId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      // Check feature access
      const org = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
      })
      if (!org) throw new TRPCError({ code: 'NOT_FOUND' })

      const plan = org.plan as Plan
      const trialExpired = plan === 'trial' && org.planExpiresAt && new Date(org.planExpiresAt) < new Date()

      if (!hasFeatureAccess(plan, 'export_csv', !!trialExpired)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: JSON.stringify({
            code: 'FEATURE_LOCKED',
            feature: 'export_csv',
            requiredPlan: 'starter',
          }),
        })
      }

      // Get funnel with stages and latest snapshots
      const funnel = await ctx.db.query.funnels.findFirst({
        where: eq(funnels.id, input.funnelId),
        with: {
          stages: {
            orderBy: [asc(funnelStages.position)],
            with: {
              metricConfigs: true,
              snapshots: {
                orderBy: [desc(metricSnapshots.collectedAt)],
                limit: 1,
              },
            },
          },
        },
      })

      if (!funnel || funnel.organizationId !== organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      // Build CSV
      const rows: string[] = []

      // Header
      rows.push('Etapa,Posicao,Integracao,Metrica,Valor,Tipo,Coletado em')

      for (const stage of funnel.stages) {
        const snapshot = stage.snapshots[0]
        const data = (snapshot?.data ?? {}) as Record<string, number | null>

        for (const config of stage.metricConfigs) {
          const value = data[config.metricKey]
          rows.push([
            `"${stage.name}"`,
            stage.position,
            stage.integrationId ?? 'N/A',
            `"${config.label}"`,
            value ?? 'N/A',
            config.metricType,
            snapshot?.collectedAt ? new Date(snapshot.collectedAt).toISOString() : 'N/A',
          ].join(','))
        }
      }

      let csvContent = rows.join('\n')

      // Add watermark for Starter plan
      if (plan === 'starter') {
        csvContent = `# Exportado por Funnlio — Remova a marca d'agua com o plano Pro\n# ${new Date().toISOString()}\n\n${csvContent}`
      }

      return {
        filename: `${funnel.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`,
        content: csvContent,
        mimeType: 'text/csv',
      }
    }),

  // Export funnel data as PDF (Pro+)
  exportPDF: protectedProcedure
    .input(z.object({
      funnelId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      const org = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
      })
      if (!org) throw new TRPCError({ code: 'NOT_FOUND' })

      const plan = org.plan as Plan
      const trialExpired = plan === 'trial' && org.planExpiresAt && new Date(org.planExpiresAt) < new Date()

      if (!hasFeatureAccess(plan, 'export_pdf', !!trialExpired)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: JSON.stringify({
            code: 'FEATURE_LOCKED',
            feature: 'export_pdf',
            requiredPlan: 'pro',
          }),
        })
      }

      // Get funnel data
      const funnel = await ctx.db.query.funnels.findFirst({
        where: eq(funnels.id, input.funnelId),
        with: {
          stages: {
            orderBy: [asc(funnelStages.position)],
            with: {
              metricConfigs: true,
              snapshots: {
                orderBy: [desc(metricSnapshots.collectedAt)],
                limit: 1,
              },
            },
          },
        },
      })

      if (!funnel || funnel.organizationId !== organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      // Build structured report data (PDF generation can be added later with a library)
      const reportData = {
        funnel: {
          name: funnel.name,
          description: funnel.description,
          status: funnel.status,
          stageCount: funnel.stages.length,
        },
        stages: funnel.stages.map(stage => ({
          name: stage.name,
          position: stage.position,
          metrics: stage.metricConfigs.map(config => ({
            label: config.label,
            value: (stage.snapshots[0]?.data as Record<string, number | null>)?.[config.metricKey] ?? null,
            type: config.metricType,
          })),
        })),
        generatedAt: new Date().toISOString(),
        organizationPlan: plan,
      }

      return {
        filename: `${funnel.name.replace(/[^a-zA-Z0-9]/g, '_')}_report_${new Date().toISOString().split('T')[0]}.json`,
        data: reportData,
        mimeType: 'application/json',
      }
    }),
})
