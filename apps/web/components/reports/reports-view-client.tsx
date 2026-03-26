'use client'

import { useState } from 'react'
import { FileText, BarChart3, TrendingDown, TrendingUp, AlertTriangle, Settings2, Calendar } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'

type Frequency = 'daily' | 'weekly' | 'monthly'

const frequencyLabels: Record<Frequency, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensal',
}

const frequencyDescriptions: Record<Frequency, string> = {
  daily: 'Metricas das ultimas 24 horas',
  weekly: 'Comparacao dos ultimos 7 dias',
  monthly: 'Visao geral dos ultimos 30 dias',
}

function MetricCard({ label, value, type }: { label: string; value: number | null; type: string }) {
  const formatted =
    type === 'currency'
      ? `R$${(value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : type === 'percentage'
        ? `${((value ?? 0) * 100).toFixed(1)}%`
        : (value ?? 0).toLocaleString('pt-BR')

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold mt-1">{formatted}</p>
    </div>
  )
}

function InsightItem({ insight }: { insight: { type: string; message: string; createdAt: string } }) {
  const icons: Record<string, typeof TrendingDown> = {
    CONVERSION_DROP: TrendingDown,
    CONVERSION_SPIKE: TrendingUp,
    FUNNEL_BOTTLENECK: AlertTriangle,
  }
  const colors: Record<string, string> = {
    CONVERSION_DROP: 'text-red-500',
    CONVERSION_SPIKE: 'text-green-500',
    FUNNEL_BOTTLENECK: 'text-yellow-500',
  }
  const Icon = icons[insight.type] ?? AlertTriangle
  const color = colors[insight.type] ?? 'text-muted-foreground'

  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', color)} />
      <p className="text-sm">{insight.message}</p>
    </div>
  )
}

export function ReportsViewClient() {
  const [frequency, setFrequency] = useState<Frequency>('daily')

  const { data: funnels = [] } = trpc.funnels.list.useQuery()
  const { data: insights = [] } = trpc.insights.list.useQuery({ limit: 5 })

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Relatorios</h1>
            <p className="text-sm text-muted-foreground">
              Visualize seus dados consolidados por periodo.
            </p>
          </div>
        </div>
        <a
          href="/reports/settings"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Configurar envio
        </a>
      </div>

      {/* Frequency tabs */}
      <div className="inline-flex rounded-lg border bg-muted/50 p-1 gap-1 mb-6">
        {(Object.keys(frequencyLabels) as Frequency[]).map((f) => (
          <button
            key={f}
            onClick={() => setFrequency(f)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              frequency === f
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {frequencyLabels[f]}
          </button>
        ))}
      </div>

      {/* Report content */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{frequencyDescriptions[frequency]}</span>
        </div>

        {/* Funnels overview */}
        {funnels.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">Nenhum funil criado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie seu primeiro funil para ver dados no relatorio.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Ir para Dashboard
            </a>
          </div>
        ) : (
          <>
            {/* Funnel cards */}
            {funnels.map((funnel) => (
              <div key={funnel.id} className="rounded-lg border bg-card">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{funnel.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {funnel.stageCount} etapas
                    </span>
                  </div>
                  {funnel.overallConversionRate !== null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Conversao geral: <span className="font-medium text-foreground">{(funnel.overallConversionRate * 100).toFixed(1)}%</span>
                    </p>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground">
                    Ultima sincronizacao: {funnel.lastSyncedAt
                      ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(funnel.lastSyncedAt))
                      : 'Nunca sincronizado'}
                  </p>
                </div>
              </div>
            ))}

            {/* Insights section */}
            {insights.length > 0 && (
              <div className="rounded-lg border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3">Top Insights</h3>
                <div className="divide-y">
                  {insights.slice(0, 3).map((insight) => (
                    <InsightItem key={insight.id} insight={insight} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
