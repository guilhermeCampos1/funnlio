import { TRPCError, router, protectedProcedure, ownerAdminProcedure, z } from '../trpc.js'
import {
  integrations,
  integrationProviders,
  eq,
  and,
} from '@funnlio/db'
import { getProvider, getAllProviders } from '@funnlio/integrations'
import { encryptCredentials, decryptCredentials } from '@funnlio/shared'

export const integrationsRouter = router({
  // ─── Listar providers disponíveis (catálogo global) ───────────────────────
  listProviders: protectedProcedure.query(async ({ ctx }) => {
    const providers = await ctx.db.query.integrationProviders.findMany({
      where: eq(integrationProviders.isActive, true),
    })

    // Enriquecer com dados do registry (métricas, schema de config)
    return providers.map((provider) => {
      const registryProvider = getAllProviders().find((p) => p.slug === provider.slug)
      return {
        id: provider.id,
        slug: provider.slug,
        name: provider.name,
        description: provider.description,
        iconUrl: provider.iconUrl,
        category: provider.category,
        configSchema: registryProvider?.configSchema ?? provider.configSchema,
        availableMetrics: registryProvider?.availableMetrics ?? [],
      }
    })
  }),

  // ─── Listar integrações da organização ───────────────────────────────────
  list: protectedProcedure.query(async ({ ctx }) => {
    const { organizationId } = ctx.session

    const rows = await ctx.db.query.integrations.findMany({
      where: eq(integrations.organizationId, organizationId),
      with: { provider: true },
    })

    // NUNCA retornar credentials para o frontend
    return rows.map(({ credentials: _creds, ...integration }) => integration)
  }),

  // ─── Criar/conectar nova integração ─────────────────────────────────────
  connect: ownerAdminProcedure
    .input(
      z.object({
        providerId: z.string().uuid(),
        name: z.string().min(1).max(100),
        credentials: z.record(z.string()),
        config: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      // Verificar que o provider existe
      const provider = await ctx.db.query.integrationProviders.findFirst({
        where: eq(integrationProviders.id, input.providerId),
      })

      if (!provider) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Provider não encontrado' })
      }

      // Validar credenciais antes de salvar
      const registryProvider = getProvider(provider.slug)
      const validation = await registryProvider.validateCredentials(input.credentials)

      if (!validation.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: validation.errorMessage ?? 'Credenciais inválidas',
        })
      }

      const encryptedCredentials = encryptCredentials(input.credentials)
      const [integration] = await ctx.db
        .insert(integrations)
        .values({
          organizationId,
          providerId: input.providerId,
          name: input.name,
          status: 'active',
          credentials: { encrypted: encryptedCredentials },
          config: input.config ?? {},
        })
        .returning()

      const { credentials: _creds, ...safeIntegration } = integration
      return safeIntegration
    }),

  // ─── Testar conexão de uma integração existente ────────────────────────
  testConnection: ownerAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      const integration = await ctx.db.query.integrations.findFirst({
        where: and(eq(integrations.id, input.id), eq(integrations.organizationId, organizationId)),
        with: { provider: true },
      })

      if (!integration) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Integração não encontrada' })
      }

      const registryProvider = getProvider(integration.provider.slug)
      const raw = integration.credentials as Record<string, string>
      const credentials = raw.encrypted
        ? decryptCredentials(raw.encrypted)
        : raw

      const result = await registryProvider.validateCredentials(credentials)

      // Atualizar status baseado no resultado
      await ctx.db
        .update(integrations)
        .set({
          status: result.valid ? 'active' : 'error',
          errorMessage: result.valid ? null : (result.errorMessage ?? 'Conexão falhou'),
          updatedAt: new Date(),
        })
        .where(eq(integrations.id, input.id))

      return result
    }),

  // ─── Listar recursos de uma integração (campanhas, pipelines, etc.) ────
  listResources: protectedProcedure
    .input(
      z.object({
        integrationId: z.string().uuid(),
        resourceType: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      const integration = await ctx.db.query.integrations.findFirst({
        where: and(
          eq(integrations.id, input.integrationId),
          eq(integrations.organizationId, organizationId)
        ),
        with: { provider: true },
      })

      if (!integration) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Integração não encontrada' })
      }

      const registryProvider = getProvider(integration.provider.slug)
      const raw = integration.credentials as Record<string, string>
      const credentials = raw.encrypted
        ? decryptCredentials(raw.encrypted)
        : raw

      const resources = await registryProvider.listResources?.(credentials, input.resourceType) ?? []
      return resources
    }),

  // ─── Remover integração ──────────────────────────────────────────────────
  disconnect: ownerAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      const [deleted] = await ctx.db
        .delete(integrations)
        .where(and(eq(integrations.id, input.id), eq(integrations.organizationId, organizationId)))
        .returning()

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Integração não encontrada' })
      }

      return { success: true }
    }),
})
