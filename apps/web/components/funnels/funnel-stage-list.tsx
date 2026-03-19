'use client'

import { useState } from 'react'
import { ArrowDown, Plug, Plus, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMetricValue } from '@funnlio/shared'
import { AddStageSheet } from './add-stage-sheet'

interface Stage {
  id: string
  name: string
  description: string | null
  position: number
  integration: {
    id: string
    name: string
    providerSlug: string
    providerName: string
    status: string
  } | null
  metrics: Array<{
    key: string
    label: string
    type: 'number' | 'currency' | 'percentage' | 'duration'
    isPrimary: boolean
    value: number | null
  }>
  conversionRateFromPrevious: number | null
  targetValue: number | null
  lastSyncedAt: Date | string | null
}

interface FunnelStageListProps {
  stages: Stage[]
  funnelId: string
}

export function FunnelStageList({ stages, funnelId }: FunnelStageListProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  if (stages.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center space-y-4">
          <div className="text-3xl">🔗</div>
          <div>
            <h3 className="font-medium">Seu funil está vazio</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Funis são compostos por etapas. Cada etapa monitora uma ferramenta diferente
              da sua estratégia de marketing.
            </p>
            <p className="text-xs text-muted-foreground mt-3 italic">
              Ex: Captação (Meta Ads) → Landing Page (Clarity) → Vendas (Pipedrive)
            </p>
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar primeira etapa
          </button>
        </div>

        {sheetOpen && (
          <AddStageSheet funnelId={funnelId} onClose={() => setSheetOpen(false)} />
        )}
      </>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {stages.map((stage, index) => (
          <div key={stage.id}>
            {/* Seta de conversão entre etapas */}
            {index > 0 && (
              <div className="flex items-center justify-center py-1">
                <div className="flex flex-col items-center gap-0.5">
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                  {stage.conversionRateFromPrevious !== null && (
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        stage.conversionRateFromPrevious >= 50
                          ? 'bg-green-100 text-green-700'
                          : stage.conversionRateFromPrevious >= 20
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      )}
                    >
                      {stage.conversionRateFromPrevious.toFixed(1)}% conversão
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Card da etapa */}
            <div className="rounded-lg border bg-card p-5 space-y-4">
              {/* Stage header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {stage.position}
                  </div>
                  <div>
                    <h3 className="font-semibold">{stage.name}</h3>
                    {stage.description && (
                      <p className="text-muted-foreground text-xs mt-0.5">{stage.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {stage.integration ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground border rounded-full px-2.5 py-1">
                      <Plug className="w-3 h-3" />
                      {stage.integration.providerName}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground border border-dashed rounded-full px-2.5 py-1">
                      Sem integração
                    </div>
                  )}

                  <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Métricas */}
              {stage.metrics.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {stage.metrics.map((metric) => (
                    <div
                      key={metric.key}
                      className={cn(
                        'rounded-md p-3 space-y-0.5',
                        metric.isPrimary ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
                      )}
                    >
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <p className={cn('font-bold', metric.isPrimary ? 'text-lg' : 'text-base')}>
                        {metric.value !== null
                          ? formatMetricValue(metric.value, metric.type)
                          : '—'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nenhuma métrica configurada para esta etapa.
                </p>
              )}

              {/* Last sync */}
              {stage.lastSyncedAt && (
                <p className="text-xs text-muted-foreground">
                  Atualizado em{' '}
                  {new Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(stage.lastSyncedAt))}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Botão adicionar nova etapa */}
        <button
          onClick={() => setSheetOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar etapa
        </button>
      </div>

      {sheetOpen && (
        <AddStageSheet funnelId={funnelId} onClose={() => setSheetOpen(false)} />
      )}
    </>
  )
}
