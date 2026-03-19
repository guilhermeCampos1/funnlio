import { TRPCError, router, protectedProcedure, z } from '../trpc.js'
import { organizations, organizationMembers, eq } from '@funnlio/db'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40)
}

export const organizationsRouter = router({
  // Verifica se o usuário já tem uma organização
  hasOrg: protectedProcedure.query(async ({ ctx }) => {
    return !!ctx.session.organizationId
  }),

  // Cria a primeira organização do usuário (onboarding)
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100).trim() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session

      // Verificar se já tem org (idempotência)
      const existing = await ctx.db.query.organizationMembers.findFirst({
        where: eq(organizationMembers.userId, userId),
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Usuário já possui uma organização',
        })
      }

      const baseSlug = slugify(input.name) || 'workspace'
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`

      const [org] = await ctx.db
        .insert(organizations)
        .values({ name: input.name, slug })
        .returning()

      await ctx.db.insert(organizationMembers).values({
        organizationId: org.id,
        userId,
        role: 'owner',
        joinedAt: new Date(),
      })

      return org
    }),
})
