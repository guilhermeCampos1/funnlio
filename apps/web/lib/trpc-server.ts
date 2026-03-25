import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '@funnlio/api'
import { headers } from 'next/headers'

// Client para uso em Server Components — passa cookies de auth automaticamente
async function createServerClient() {
  const headersList = await headers()
  const cookie = headersList.get('cookie') ?? ''

  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/trpc`,
        headers: { cookie },
      }),
    ],
  })
}

export const api = {
  funnels: {
    list: { query: async () => (await createServerClient()).funnels.list.query() },
    getById: { query: async (input: { id: string }) => (await createServerClient()).funnels.getById.query(input) },
  },
  organizations: {
    hasOrg: { query: async () => (await createServerClient()).organizations.hasOrg.query() },
  },
  integrations: {
    list: { query: async () => (await createServerClient()).integrations.list.query() },
  },
}
