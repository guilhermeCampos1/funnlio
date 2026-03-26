'use client'

import { useState, useEffect } from 'react'
import { X, Plug, Check } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useRouter } from 'next/navigation'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { getMetricTooltip } from '@/lib/metric-definitions'

// KPIs pré-selecionados por provider slug
const DEFAULT_SELECTED: Record<string, string[]> = {
  meta_ads: ['spend', 'leads', 'cpl'],
  pipedrive: ['leads_count', 'deals_won', 'revenue_won'],
  google_ads: ['cost', 'conversions', 'cpa'],
  clarity: ['sessions', 'bounce_rate'],
  google_analytics_4: ['sessions', 'conversions'],
}

interface Props {
  funnelId: string
  onClose: () => void
}

export function AddStageSheet({ funnelId, onClose }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null)
  const [selectedMetricKeys, setSelectedMetricKeys] = useState<Set<string>>(new Set())

  const { data: integrations = [] } = trpc.integrations.list.useQuery()
  const { data: providers = [] } = trpc.integrations.listProviders.useQuery()

  const createStage = trpc.stages.create.useMutation()
  const setMetrics = trpc.stages.setMetrics.useMutation()

  const selectedIntegration = integrations.find(i => i.id === selectedIntegrationId)
  const selectedProvider = selectedIntegration
    ? providers.find(p => p.slug === selectedIntegration.provider.slug)
    : null
  const availableMetrics = selectedProvider?.availableMetrics ?? []

  // Pré-selecionar KPIs padrão ao selecionar uma integração
  useEffect(() => {
    if (selectedProvider) {
      const defaults = DEFAULT_SELECTED[selectedProvider.slug] ?? []
      setSelectedMetricKeys(new Set(defaults))
    }
  }, [selectedProvider?.slug])

  function toggleMetric(key: string) {
    setSelectedMetricKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  async function handleSubmit() {
    if (!name.trim()) return

    const stage = await createStage.mutateAsync({
      funnelId,
      name: name.trim(),
      integrationId: selectedIntegrationId ?? undefined,
    })

    if (selectedMetricKeys.size > 0 && availableMetrics.length > 0) {
      const metrics = availableMetrics
        .filter(m => selectedMetricKeys.has(m.key))
        .map((m, i) => ({
          metricKey: m.key,
          label: m.label,
          metricType: m.type as 'number' | 'currency' | 'percentage' | 'duration',
          isPrimary: i === 0,
          aggregation: 'sum' as const,
        }))

      await setMetrics.mutateAsync({ stageId: stage.id, metrics })
    }

    router.refresh()
    onClose()
  }

  const isLoading = createStage.isPending || setMetrics.isPending
  const canSubmit = name.trim().length > 0 && !isLoading

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background border-l shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Adicionar etapa</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Microcopy */}
          <p className="text-xs text-muted-foreground">
            Uma etapa puxa métricas automaticamente da ferramenta que você selecionar. Você pode alterar tudo depois.
          </p>

          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nome da etapa *</label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Tráfego Pago, Leads Qualificados, Vendas Fechadas"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Ferramenta */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ferramenta</label>
            <p className="text-xs text-muted-foreground">
              Qual ferramenta fornece os dados desta etapa? Precisa estar conectada em Integrações.
            </p>

            {integrations.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-center">
                <Plug className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma integração conectada ainda.
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Você pode adicionar a etapa agora e conectar a ferramenta depois.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {integrations.map(integration => (
                  <button
                    key={integration.id}
                    onClick={() =>
                      setSelectedIntegrationId(prev =>
                        prev === integration.id ? null : integration.id
                      )
                    }
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md border text-left text-sm transition-colors ${
                      selectedIntegrationId === integration.id
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-input hover:bg-muted'
                    }`}
                  >
                    <span className="truncate">{integration.provider.name}</span>
                    {selectedIntegrationId === integration.id && (
                      <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* KPIs */}
          {availableMetrics.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">KPIs a observar</label>
              <p className="text-xs text-muted-foreground">
                Selecione as métricas que deseja acompanhar nesta etapa.
              </p>
              <div className="space-y-1.5">
                {availableMetrics.map(metric => {
                  const checked = selectedMetricKeys.has(metric.key)
                  return (
                    <button
                      key={metric.key}
                      onClick={() => toggleMetric(metric.key)}
                      className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-md border text-left transition-colors ${
                        checked
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-input hover:bg-muted'
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center ${
                          checked ? 'bg-primary border-primary' : 'border-input'
                        }`}
                      >
                        {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium leading-tight">{metric.label}</p>
                          {getMetricTooltip(metric.key) && (
                            <HelpTooltip text={getMetricTooltip(metric.key)!} side="right" />
                          )}
                        </div>
                        {metric.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                            {metric.description}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {(createStage.error || setMetrics.error) && (
            <p className="text-sm text-destructive">
              {createStage.error?.message ?? setMetrics.error?.message}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-2 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Salvando...' : 'Adicionar etapa'}
          </button>
        </div>
      </div>
    </>
  )
}
