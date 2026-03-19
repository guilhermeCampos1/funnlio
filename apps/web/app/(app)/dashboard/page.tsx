import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { api } from '@/lib/trpc-server'
import { FunnelCard } from '@/components/funnels/funnel-card'
import { CreateFunnelButton } from '@/components/funnels/create-funnel-button'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const hasOrg = await api.organizations.hasOrg.query()

  if (!hasOrg) {
    redirect('/onboarding')
  }

  const funnels = await api.funnels.list.query()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funis de Marketing</h1>
          <p className="text-muted-foreground">
            {funnels.length} funil{funnels.length !== 1 ? 's' : ''} ativo{funnels.length !== 1 ? 's' : ''}
          </p>
        </div>
        <CreateFunnelButton />
      </div>

      {funnels.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium">Nenhum funil criado ainda</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm">
            Crie seu primeiro funil para começar a analisar sua jornada de marketing
          </p>
          <div className="mt-4">
            <CreateFunnelButton />
          </div>
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
