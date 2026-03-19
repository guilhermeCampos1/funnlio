import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, type TRPCContext } from '@funnlio/api'
import { db, organizationMembers, eq } from '@funnlio/db'
import { auth } from '@/lib/auth'
import type { NextRequest } from 'next/server'

async function createContext(req: NextRequest): Promise<TRPCContext> {
  const session = await auth.api.getSession({ headers: req.headers })

  if (!session) {
    return { db, sessionId: null, session: null }
  }

  // Buscar a organização real do usuário via membership (não depende de activeOrganizationId)
  const membership = await db.query.organizationMembers.findFirst({
    where: eq(organizationMembers.userId, session.user.id),
  })

  return {
    db,
    sessionId: session.session.id,
    session: {
      userId: session.user.id,
      organizationId: membership?.organizationId ?? '',
      orgRole: (membership?.role as 'owner' | 'admin' | 'viewer') ?? 'viewer',
      userRole: (session.user as { role?: 'saas_admin' | 'member' }).role ?? 'member',
    },
  }
}

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(`tRPC error on ${path}:`, error)
          }
        : undefined,
  })

export { handler as GET, handler as POST }
