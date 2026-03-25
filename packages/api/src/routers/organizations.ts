import { TRPCError, router, protectedProcedure, ownerAdminProcedure, z } from '../trpc.js'
import { organizations, organizationMembers, users, eq, and } from '@funnlio/db'

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

  // Lista todas as orgs do usuário
  listMyOrgs: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.query.organizationMembers.findMany({
      where: eq(organizationMembers.userId, ctx.session.userId),
      with: { organization: true },
    })

    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      plan: m.organization.plan,
      role: m.role,
      isCurrent: m.organization.id === ctx.session.organizationId,
    }))
  }),

  // Lista membros da org atual
  listMembers: protectedProcedure.query(async ({ ctx }) => {
    const { organizationId } = ctx.session

    const members = await ctx.db.query.organizationMembers.findMany({
      where: eq(organizationMembers.organizationId, organizationId),
      with: { user: true },
    })

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
      role: m.role,
      joinedAt: m.joinedAt,
    }))
  }),

  // Convidar membro (placeholder — requer email service)
  inviteMember: ownerAdminProcedure
    .input(z.object({
      email: z.string().email(),
      role: z.enum(['admin', 'viewer']).default('viewer'),
    }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      // Check if user exists
      const existingUser = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      })

      if (!existingUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuário não encontrado. O convidado precisa ter uma conta no Funnlio.',
        })
      }

      // Check if already member
      const existingMember = await ctx.db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, existingUser.id),
        ),
      })

      if (existingMember) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Este usuário já é membro da organização.',
        })
      }

      const [member] = await ctx.db.insert(organizationMembers).values({
        organizationId,
        userId: existingUser.id,
        role: input.role,
        invitedAt: new Date(),
        joinedAt: new Date(),
      }).returning()

      return member
    }),

  // Remover membro
  removeMember: ownerAdminProcedure
    .input(z.object({ memberId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      const member = await ctx.db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.id, input.memberId),
          eq(organizationMembers.organizationId, organizationId),
        ),
      })

      if (!member) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Membro não encontrado' })
      }

      if (member.role === 'owner') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Não é possível remover o dono da organização' })
      }

      await ctx.db.delete(organizationMembers).where(eq(organizationMembers.id, input.memberId))

      return { success: true }
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

  // Atualizar role de membro
  updateMemberRole: ownerAdminProcedure
    .input(z.object({
      memberId: z.string().uuid(),
      role: z.enum(['admin', 'viewer']),
    }))
    .mutation(async ({ ctx, input }) => {
      const { organizationId } = ctx.session

      const member = await ctx.db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.id, input.memberId),
          eq(organizationMembers.organizationId, organizationId),
        ),
      })

      if (!member) throw new TRPCError({ code: 'NOT_FOUND', message: 'Membro não encontrado' })
      if (member.role === 'owner') throw new TRPCError({ code: 'FORBIDDEN', message: 'Role do owner não pode ser alterado' })

      await ctx.db
        .update(organizationMembers)
        .set({ role: input.role })
        .where(eq(organizationMembers.id, input.memberId))

      return { success: true }
    }),
})
