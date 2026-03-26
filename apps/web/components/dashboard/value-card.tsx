'use client'

import { trpc } from '@/lib/trpc'
import { DollarSign, BarChart2, AlertTriangle, Database, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ValueCard() {
  const { data, isLoading } = trpc.valueMetrics.getMonthlyValue.useQuery()

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 animate-pulse">
        <div className="h-5 w-48 bg-muted rounded mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const metrics = [
    {
      icon: DollarSign,
      label: 'receita rastreada',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(data.revenueTracked),
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      icon: BarChart2,
      label: 'de análise automática',
      value: `~${data.hoursSaved}h`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      icon: AlertTriangle,
      label: 'gargalos encontrados',
      value: String(data.bottlenecksFound),
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    },
    {
      icon: Database,
      label: 'dias de dados',
      value: String(data.daysOfData),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    },
  ]

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-base">Seu Mes em Numeros</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={cn('rounded-lg p-4', metric.bgColor)}
          >
            <div className="flex items-center gap-2 mb-1">
              <metric.icon className={cn('w-4 h-4', metric.color)} />
            </div>
            <p className={cn('text-xl font-bold', metric.color)}>
              {metric.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {metric.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
