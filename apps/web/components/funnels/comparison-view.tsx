'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { ArrowDown, ArrowUp, Minus, GitCompare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FeatureGate } from '@/components/billing/feature-gate'
import { formatMetricValue } from '@funnlio/shared'

interface ComparisonViewProps {
  funnelId: string
}

export function ComparisonView({ funnelId }: ComparisonViewProps) {
  const now = new Date()
  const [periodA, setPeriodA] = useState({
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
    end: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0],
  })
  const [periodB, setPeriodB] = useState({
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
    end: now.toISOString().split('T')[0],
  })

  const { data: comparison, isLoading } = trpc.comparison.compare.useQuery({
    funnelId,
    periodA,
    periodB,
  })

  return (
    <FeatureGate feature="comparison">
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitCompare className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-base">Comparação de Períodos</h2>
        </div>

        {/* Period selectors */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Período A</label>
            <div className="flex gap-2">
              <input type="date" value={periodA.start} onChange={e => setPeriodA(p => ({ ...p, start: e.target.value }))} className="flex-1 rounded-md border bg-background px-2 py-1 text-sm" />
              <input type="date" value={periodA.end} onChange={e => setPeriodA(p => ({ ...p, end: e.target.value }))} className="flex-1 rounded-md border bg-background px-2 py-1 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Período B</label>
            <div className="flex gap-2">
              <input type="date" value={periodB.start} onChange={e => setPeriodB(p => ({ ...p, start: e.target.value }))} className="flex-1 rounded-md border bg-background px-2 py-1 text-sm" />
              <input type="date" value={periodB.end} onChange={e => setPeriodB(p => ({ ...p, end: e.target.value }))} className="flex-1 rounded-md border bg-background px-2 py-1 text-sm" />
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}
          </div>
        ) : comparison ? (
          <div className="space-y-4">
            {comparison.stages.map((stage) => (
              <div key={stage.stageId} className="rounded-md border p-4">
                <h3 className="text-sm font-medium mb-3">{stage.stageName}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {stage.metrics.map((metric) => {
                    const metricType = metric.type as 'number' | 'currency' | 'percentage' | 'duration'
                    const formattedA = metric.valueA != null ? formatMetricValue(metric.valueA, metricType) : '—'
                    const formattedB = metric.valueB != null ? formatMetricValue(metric.valueB, metricType) : '—'
                    const absDelta = metric.deltaPercent != null ? Math.abs(metric.deltaPercent) : 0
                    const isNegligible = absDelta < 2
                    const isNegative = metric.deltaPercent != null && metric.deltaPercent < 0

                    return (
                      <div key={metric.key} className="text-center">
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="text-sm">{formattedA}</span>
                          <span className="text-muted-foreground">&rarr;</span>
                          <span className="text-sm font-medium">{formattedB}</span>
                        </div>
                        {metric.deltaPercent != null && (
                          <div className="mt-1">
                            <div className={cn(
                              'flex items-center justify-center gap-0.5 text-xs font-medium',
                              isNegligible
                                ? 'text-muted-foreground'
                                : metric.deltaPercent > 0 ? 'text-green-600' : metric.deltaPercent < 0 ? 'text-red-600' : 'text-muted-foreground'
                            )}>
                              {metric.deltaPercent > 0 ? <ArrowUp className="w-3 h-3" /> : metric.deltaPercent < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                              {absDelta.toFixed(1)}%
                            </div>
                            {isNegative && !isNegligible && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Causas comuns: sazonalidade, mudança de orçamento
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </FeatureGate>
  )
}
