'use client'

import { useState, useEffect } from 'react'
import { X, Check, Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useRouter } from 'next/navigation'

interface Props {
  stageId: string
  stageName: string
  integrationId: string
  currentConfig: Record<string, unknown> | null
  onClose: () => void
}

export function StageConfigSheet({ stageId, stageName, integrationId, currentConfig, onClose }: Props) {
  const router = useRouter()
  const [selectedResources, setSelectedResources] = useState<Record<string, string[]>>(
    (currentConfig as Record<string, string[]>) ?? {}
  )

  // Fetch available resource types (campaigns, pipelines, etc.)
  const { data: campaigns, isLoading: loadingCampaigns } = trpc.integrations.listResources.useQuery(
    { integrationId, resourceType: 'campaigns' },
    { retry: false }
  )
  const { data: pipelines, isLoading: loadingPipelines } = trpc.integrations.listResources.useQuery(
    { integrationId, resourceType: 'pipelines' },
    { retry: false }
  )

  const updateStage = trpc.stages.update.useMutation({
    onSuccess: () => {
      router.refresh()
      onClose()
    },
  })

  // Combine all available resources into sections
  const sections: Array<{ type: string; label: string; items: Array<{ id: string; label: string }> }> = []

  if (campaigns && campaigns.length > 0) {
    sections.push({ type: 'campaign_ids', label: 'Campanhas', items: campaigns })
  }
  if (pipelines && pipelines.length > 0) {
    sections.push({ type: 'pipeline_id', label: 'Pipelines', items: pipelines })
  }

  const isLoading = loadingCampaigns || loadingPipelines

  function toggleResource(type: string, resourceId: string) {
    setSelectedResources((prev) => {
      const current = prev[type] ?? []
      const next = current.includes(resourceId)
        ? current.filter((id) => id !== resourceId)
        : [...current, resourceId]
      return { ...prev, [type]: next }
    })
  }

  function handleSave() {
    updateStage.mutate({
      id: stageId,
      metricConfig: selectedResources,
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background border-l shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Configurar: {stageName}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <p className="text-sm text-muted-foreground">
            Selecione quais campanhas ou pipelines esta etapa deve monitorar. Se não selecionar nenhuma, nenhuma métrica será coletada.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando recursos...</span>
            </div>
          ) : sections.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 space-y-2">
              <p>Nenhuma campanha ou pipeline encontrado.</p>
              <p className="text-xs">Isso pode acontecer se a integração não está conectada corretamente ou se não há campanhas ativas na ferramenta.</p>
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.type} className="space-y-2">
                <label className="text-sm font-medium">{section.label}</label>
                <div className="space-y-1.5">
                  {section.items.map((item) => {
                    const checked = (selectedResources[section.type] ?? []).includes(item.id)
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleResource(section.type, item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-colors ${
                          checked
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-input hover:bg-muted'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center ${
                            checked ? 'bg-primary border-primary' : 'border-input'
                          }`}
                        >
                          {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                        </div>
                        <span className="text-sm">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}

          {updateStage.error && (
            <p className="text-sm text-destructive">{updateStage.error.message}</p>
          )}
        </div>

        <div className="px-6 py-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={updateStage.isPending}
            className="flex-1 py-2 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {updateStage.isPending ? 'Salvando...' : 'Salvar configuração'}
          </button>
        </div>
      </div>
    </>
  )
}
