'use client'

import { trpc } from '@/lib/trpc'
import { GitBranch, ArrowDown } from 'lucide-react'
import { formatMetricValue } from '@funnlio/shared'

interface PublicDashboardProps {
  token: string
}

export function PublicDashboard({ token }: PublicDashboardProps) {
  const { data, isLoading, error } = trpc.publicLinks.view.useQuery({ token })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl py-8 px-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-lg border bg-card p-5">
                <div className="h-5 w-32 bg-muted rounded animate-pulse mb-3" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[1, 2, 3].map(j => (
                    <div key={j}>
                      <div className="h-3 w-16 bg-muted rounded animate-pulse mb-1" />
                      <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Link não encontrado</h1>
          <p className="text-muted-foreground">Este link pode ter expirado ou sido desativado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <h1 className="text-2xl font-bold mb-8">{data.funnelName}</h1>

        {data.stages.every(s => s.metrics.length === 0) ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <GitBranch className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="font-semibold text-base mb-1">Este funil ainda não coletou dados</h2>
            <p className="text-sm text-muted-foreground">As métricas aparecerão aqui após a primeira sincronização.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.stages.map((stage, i) => (
              <div key={i}>
                <div className="rounded-lg border bg-card p-5">
                  <h2 className="font-semibold text-base mb-3">{stage.name}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {stage.metrics.map((metric) => (
                      <div key={metric.key}>
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
                        <p className="text-lg font-semibold">
                          {metric.value != null
                            ? formatMetricValue(metric.value, metric.type as 'number' | 'currency' | 'percentage' | 'duration')
                            : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                  {stage.lastSyncedAt && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Atualizado em {new Date(stage.lastSyncedAt).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
                {i < data.stages.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowDown className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {data.showBranding && (
          <div className="mt-8 text-center">
            <a href="/signup?ref=public-link" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <GitBranch className="w-3 h-3" />
              Powered by Funnlio — Crie seu dashboard de funil grátis
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
