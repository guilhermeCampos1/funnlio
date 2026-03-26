'use client'

import { trpc } from '@/lib/trpc'
import { PlanBadge } from '@/components/billing/plan-badge'
import type { Plan } from '@funnlio/shared'
import { Building2, Users, GitBranch, Plug } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminOrgsClient() {
  const { data: orgs, isLoading } = trpc.admin.listOrganizations.useQuery({})

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Organizações</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : orgs && orgs.length > 0 ? (
        <div className="space-y-3">
          {orgs.map((org: { id: string; name: string; slug: string; plan: string; funnelsCount: number; integrationsCount: number; usersCount: number; health: { status: string }; createdAt: string | Date }) => (
            <div key={org.id} className="rounded-lg border bg-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm">{org.name}</h3>
                  <PlanBadge plan={org.plan as Plan} />
                  <span className={cn(
                    'w-2 h-2 rounded-full',
                    org.health.status === 'healthy' ? 'bg-green-500' :
                    org.health.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  )} />
                </div>
                <p className="text-xs text-muted-foreground">{org.slug}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{org.funnelsCount}</span>
                <span className="flex items-center gap-1"><Plug className="w-3 h-3" />{org.integrationsCount}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{org.usersCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(org.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Nenhuma organização cadastrada.</p>
      )}
    </div>
  )
}
