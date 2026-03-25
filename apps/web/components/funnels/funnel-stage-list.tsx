'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ArrowDown, Plug, Plus, RefreshCw, Settings2, GripVertical, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMetricValue } from '@funnlio/shared'
import { trpc } from '@/lib/trpc'
import { useRouter } from 'next/navigation'
import { AddStageSheet } from './add-stage-sheet'
import { StageConfigSheet } from './stage-config-sheet'

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

function timeAgo(date: Date | string): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min atrás`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h atrás`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}d atrás`
}

export function FunnelStageList({ stages, funnelId }: FunnelStageListProps) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [configStage, setConfigStage] = useState<Stage | null>(null)
  const [syncingStages, setSyncingStages] = useState<Set<string>>(new Set())

  // Drag & drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [orderedStages, setOrderedStages] = useState(stages)
  useEffect(() => { setOrderedStages(stages) }, [stages])

  const triggerSync = trpc.metrics.triggerSync.useMutation()
  const getSyncStatus = trpc.metrics.getSyncStatus.useQuery(
    { jobId: '' },
    { enabled: false }
  )
  const reorder = trpc.stages.reorder.useMutation({
    onSuccess: () => router.refresh(),
  })

  const pollJobStatus = useCallback(async (jobId: string, stageId: string) => {
    const poll = async () => {
      try {
        const result = await fetch(`/api/trpc/metrics.getSyncStatus?input=${encodeURIComponent(JSON.stringify({ jobId }))}`)
        const json = await result.json()
        const status = json?.result?.data?.status
        if (status === 'success' || status === 'failed') {
          setSyncingStages((prev) => {
            const next = new Set(prev)
            next.delete(stageId)
            return next
          })
          router.refresh()
          return
        }
        setTimeout(poll, 2000)
      } catch {
        setSyncingStages((prev) => {
          const next = new Set(prev)
          next.delete(stageId)
          return next
        })
      }
    }
    poll()
  }, [router])

  async function handleSync(stageId: string) {
    setSyncingStages((prev) => new Set(prev).add(stageId))
    try {
      const result = await triggerSync.mutateAsync({ stageId })
      pollJobStatus(result.jobId, stageId)
    } catch {
      setSyncingStages((prev) => {
        const next = new Set(prev)
        next.delete(stageId)
        return next
      })
    }
  }

  // Drag & drop handlers
  function handleDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newOrder = [...orderedStages]
    const [moved] = newOrder.splice(draggedIndex, 1)
    newOrder.splice(index, 0, moved)
    setOrderedStages(newOrder)
    setDraggedIndex(index)
  }

  function handleDragEnd() {
    if (draggedIndex !== null) {
      const stageIds = orderedStages.map((s) => s.id)
      const originalIds = stages.map((s) => s.id)

      if (JSON.stringify(stageIds) !== JSON.stringify(originalIds)) {
        reorder.mutate({ funnelId, stageIds })
      }
    }
    setDraggedIndex(null)
  }

  if (orderedStages.length === 0) {
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
        {orderedStages.map((stage, index) => {
          const isSyncing = syncingStages.has(stage.id)

          return (
            <div
              key={stage.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
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
              <div
                className={cn(
                  'rounded-lg border bg-card p-5 space-y-4 transition-opacity',
                  draggedIndex === index && 'opacity-50'
                )}
              >
                {/* Stage header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">{stage.name}</h3>
                      {stage.description && (
                        <p className="text-muted-foreground text-xs mt-0.5">{stage.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
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

                    {stage.integration && (
                      <button
                        onClick={() => setConfigStage(stage)}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                        title="Configurar recursos"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleSync(stage.id)}
                      disabled={isSyncing || !stage.integration}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40"
                      title="Sincronizar"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
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

                {/* Last sync indicator */}
                {stage.lastSyncedAt && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Atualizado {timeAgo(stage.lastSyncedAt)}</span>
                    <span className="text-muted-foreground/50">
                      ({new Intl.DateTimeFormat('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(stage.lastSyncedAt))})
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}

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

      {configStage?.integration && (
        <StageConfigSheet
          stageId={configStage.id}
          stageName={configStage.name}
          integrationId={configStage.integration.id}
          currentConfig={null}
          onClose={() => setConfigStage(null)}
        />
      )}
    </>
  )
}
