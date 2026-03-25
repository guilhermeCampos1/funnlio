import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/trpc-server'
import { FunnelCard } from '@/components/funnels/funnel-card'
import { CreateFunnelButton } from '@/components/funnels/create-funnel-button'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const hasOrg = await api.organizations.hasOrg.query()

  if (!hasOrg) {
    redirect('/onboarding')
  }

  const [funnels, integrations] = await Promise.all([
    api.funnels.list.query(),
    api.integrations.list.query(),
  ])

  const hasIntegrations = integrations.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funis de Marketing</h1>
          <p className="text-muted-foreground">
            {funnels.length} funil{funnels.length !== 1 ? 's' : ''} ativo{funnels.length !== 1 ? 's' : ''}
          </p>
        </div>
        {hasIntegrations && <CreateFunnelButton />}
      </div>

      {funnels.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          {hasIntegrations ? (
            <>
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium">Crie seu primeiro funil</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                Um funil conecta suas ferramentas e mostra taxas de conversão entre cada etapa automaticamente.
              </p>
              <div className="mt-4">
                <CreateFunnelButton />
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-lg font-medium">Conecte sua primeira ferramenta</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-md">
                Antes de criar funis, conecte pelo menos uma ferramenta (Meta Ads, Pipedrive, etc.) para o Funnlio poder coletar métricas.
              </p>
              <Link
                href="/integrations"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Conectar ferramenta
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {funnels.map((funnel) => (
            <FunnelCard key={funnel.id} funnel={funnel} />
          ))}
        </div>
      )}
    </div>
  )
}
