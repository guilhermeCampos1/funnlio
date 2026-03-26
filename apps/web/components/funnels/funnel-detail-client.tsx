'use client'

import { useState } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { FunnelHeader } from './funnel-header'
import { FunnelStageList } from './funnel-stage-list'
import { MetricsChart } from './metrics-chart'

type DatePreset = 'last7d' | 'last30d' | 'last90d' | 'custom'

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

const presetLabels: Record<string, string> = {
  last7d: '7d',
  last30d: '30d',
  last90d: '90d',
}

function formatDateInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function FunnelDetailClient({ funnel }: Props) {
  const [datePreset, setDatePreset] = useState<DatePreset>('last30d')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return formatDateInput(d)
  })
  const [customEnd, setCustomEnd] = useState(() => formatDateInput(new Date()))

  const stagesWithIntegration = funnel.stages.filter((s) => s.integration && s.metrics.length > 0)

  // For the chart, pass the preset or 'last30d' as fallback (custom range handled separately)
  const chartPreset = datePreset === 'custom' ? 'last30d' : datePreset

  function handleApplyCustom() {
    setDatePreset('custom')
    setCalendarOpen(false)
  }

  const customLabel = datePreset === 'custom'
    ? `${new Date(customStart).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} — ${new Date(customEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
    : null

  return (
    <div className="space-y-6">
      <FunnelHeader funnel={funnel} />

      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Período:</span>
        <div className="inline-flex items-center rounded-lg border bg-card shadow-sm">
          {Object.entries(presetLabels).map(([preset, label], i) => (
            <button
              key={preset}
              onClick={() => { setDatePreset(preset as DatePreset); setCalendarOpen(false) }}
              className={`px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                datePreset === preset
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              } ${i === 0 ? 'rounded-l-lg' : ''}`}
            >
              {label}
            </button>
          ))}

          {/* Custom date / Calendar button */}
          <div className="relative">
            <button
              onClick={() => setCalendarOpen(!calendarOpen)}
              className={`px-3 py-1.5 rounded-r-lg transition-all duration-200 flex items-center gap-1.5 ${
                datePreset === 'custom'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              {customLabel ? (
                <span className="text-xs font-semibold">{customLabel}</span>
              ) : (
                <span className="text-xs font-semibold">Custom</span>
              )}
            </button>

            {/* Calendar dropdown */}
            {calendarOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setCalendarOpen(false)} />
                <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border bg-card shadow-xl p-4 space-y-4 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Período personalizado</h4>
                    <button
                      onClick={() => setCalendarOpen(false)}
                      className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Data início</label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        max={customEnd}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Data fim</label>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        min={customStart}
                        max={formatDateInput(new Date())}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleApplyCustom}
                    className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
                  >
                    Aplicar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      {stagesWithIntegration.length > 0 && (
        <MetricsChart stages={stagesWithIntegration} datePreset={chartPreset} />
      )}

      <FunnelStageList stages={funnel.stages} funnelId={funnel.id} />
    </div>
  )
}
