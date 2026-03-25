'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { trpc } from '@/lib/trpc'

interface Stage {
  id: string
  name: string
  metrics: Array<{
    key: string
    label: string
    type: 'number' | 'currency' | 'percentage' | 'duration'
    isPrimary: boolean
    value: number | null
  }>
}

interface Props {
  stages: Stage[]
  datePreset: 'last7d' | 'last30d' | 'last90d'
}

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4']

export function MetricsChart({ stages, datePreset }: Props) {
  // Fetch history for each stage in parallel
  const queries = stages.map((stage) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    trpc.metrics.getStageHistory.useQuery(
      { stageId: stage.id, preset: datePreset },
      { staleTime: 60000 }
    )
  )

  const isLoading = queries.some((q) => q.isLoading)

  // Build chart data: merge all snapshots by date
  const chartData = useMemo(() => {
    const dateMap = new Map<string, Record<string, string | number | null>>()

    stages.forEach((stage, i) => {
      const snapshots = queries[i]?.data ?? []
      const primaryMetric = stage.metrics.find((m) => m.isPrimary)
      if (!primaryMetric) return

      for (const snap of snapshots) {
        const dateKey = new Date(snap.collectedAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        })

        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, { date: dateKey })
        }
        const entry = dateMap.get(dateKey)!
        const value = (snap.data as Record<string, number>)[primaryMetric.key] ?? null
        // If multiple snapshots on same day, keep latest
        entry[stage.name] = value
      }
    })

    return Array.from(dateMap.values()).reverse()
  }, [stages, queries])

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Carregando gráfico...</p>
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="h-32 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Nenhum dado coletado ainda para o período selecionado.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-3">
      <h3 className="text-sm font-medium">Evolução da métrica principal por etapa</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
          />
          <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--card))',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {stages.map((stage, i) => (
            <Line
              key={stage.id}
              type="monotone"
              dataKey={stage.name}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
