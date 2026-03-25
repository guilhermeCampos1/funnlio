'use client'

import { useState } from 'react'
import { FunnelHeader } from './funnel-header'
import { FunnelStageList } from './funnel-stage-list'
import { MetricsChart } from './metrics-chart'

type DatePreset = 'last7d' | 'last30d' | 'last90d'

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

interface Funnel {
  id: string
  name: string
  description: string | null
  status: string
  color: string | null
  stages: Stage[]
}

interface Props {
  funnel: Funnel
}

const presetLabels: Record<DatePreset, string> = {
  last7d: '7 dias',
  last30d: '30 dias',
  last90d: '90 dias',
}

export function FunnelDetailClient({ funnel }: Props) {
  const [datePreset, setDatePreset] = useState<DatePreset>('last30d')

  const stagesWithIntegration = funnel.stages.filter((s) => s.integration && s.metrics.length > 0)

  return (
    <div className="space-y-6">
      <FunnelHeader funnel={funnel} />

      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Período:</span>
        <div className="inline-flex rounded-md border">
          {(Object.entries(presetLabels) as [DatePreset, string][]).map(([preset, label]) => (
            <button
              key={preset}
              onClick={() => setDatePreset(preset)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                datePreset === preset
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              } ${preset === 'last7d' ? 'rounded-l-md' : ''} ${preset === 'last90d' ? 'rounded-r-md' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {stagesWithIntegration.length > 0 && (
        <MetricsChart stages={stagesWithIntegration} datePreset={datePreset} />
      )}

      <FunnelStageList stages={funnel.stages} funnelId={funnel.id} />
    </div>
  )
}
