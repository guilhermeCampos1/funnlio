'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Minus, ChevronDown, AlertTriangle } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import { FeatureGate } from '@/components/billing/feature-gate'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BenchmarkMetric {
  metricKey: string
  metricLabel: string
  yourValue: number | null
  verticalAverage: number
  type: 'number' | 'currency' | 'percentage' | 'duration'
  sampleSize?: number
  updatedAt?: string
}

interface VerticalOption {
  slug: string
  label: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VERTICALS: VerticalOption[] = [
  { slug: 'ecommerce', label: 'E-commerce' },
  { slug: 'saas', label: 'SaaS / Software' },
  { slug: 'education', label: 'Educacao / Cursos' },
  { slug: 'agency', label: 'Agencia / Consultoria' },
  { slug: 'finance', label: 'Financas / Fintech' },
  { slug: 'health', label: 'Saude / Bem-estar' },
  { slug: 'realestate', label: 'Imobiliario' },
  { slug: 'services', label: 'Servicos Profissionais' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatValue(value: number | null, type: string): string {
  if (value === null) return '-'
  switch (type) {
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`
    case 'currency':
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    case 'duration':
      return `${value.toFixed(0)}s`
    default:
      return new Intl.NumberFormat('pt-BR').format(value)
  }
}

function getDiffPercent(yours: number | null, average: number): number | null {
  if (yours === null || average === 0) return null
  return ((yours - average) / average) * 100
}

// ---------------------------------------------------------------------------
// Vertical selector
// ---------------------------------------------------------------------------

function VerticalSelector({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (slug: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
      >
        {selected
          ? VERTICALS.find((v) => v.slug === selected)?.label ?? selected
          : 'Selecionar vertical'}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-56 rounded-lg border bg-card shadow-lg z-20 py-1 max-h-60 overflow-y-auto">
            {VERTICALS.map((v) => (
              <button
                key={v.slug}
                type="button"
                onClick={() => {
                  onSelect(v.slug)
                  setOpen(false)
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors',
                  selected === v.slug && 'bg-muted font-medium',
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Benchmark row
// ---------------------------------------------------------------------------

function BenchmarkRow({ metric }: { metric: BenchmarkMetric }) {
  const diff = getDiffPercent(metric.yourValue, metric.verticalAverage)
  const isAbove = diff !== null && diff > 0
  const isBelow = diff !== null && diff < 0
  const isNeutral = diff === null || Math.abs(diff) < 1

  const formattedDate = metric.updatedAt
    ? new Date(metric.updatedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <div className="py-3 space-y-1">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{metric.metricLabel}</p>
        </div>

        <div className="text-right flex-shrink-0 w-24">
          <p className="text-sm font-semibold">{formatValue(metric.yourValue, metric.type)}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sua taxa</p>
        </div>

        <div className="text-right flex-shrink-0 w-24">
          <p className="text-sm text-muted-foreground">{formatValue(metric.verticalAverage, metric.type)}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Media</p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 w-20 justify-end">
          {isNeutral ? (
            <Minus className="w-3.5 h-3.5 text-muted-foreground" />
          ) : isAbove ? (
            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              isNeutral && 'text-muted-foreground',
              isAbove && 'text-green-600',
              isBelow && 'text-red-500',
            )}
          >
            {diff !== null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%` : '-'}
          </span>
        </div>
      </div>

      {/* Sample size and confidence context */}
      <div className="flex items-center gap-2 pl-0">
        {metric.sampleSize != null && (
          <span className="text-[10px] text-muted-foreground">
            Baseado em {metric.sampleSize} empresas
            {formattedDate ? ` | Atualizado em ${formattedDate}` : ''}
          </span>
        )}
        {metric.sampleSize != null && metric.sampleSize < 30 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            <AlertTriangle className="w-2.5 h-2.5" />
            Amostra limitada
          </span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function BenchmarksSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="h-5 w-32 bg-muted animate-pulse rounded" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state (no vertical selected)
// ---------------------------------------------------------------------------

function VerticalPrompt({ onSelect }: { onSelect: (slug: string) => void }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Benchmarks do Mercado</h3>
          <p className="text-xs text-muted-foreground">Compare suas metricas com a media do seu setor.</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Selecione a vertical do seu negocio para ver como suas taxas de conversao se comparam com a media do mercado.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {VERTICALS.map((v) => (
          <button
            key={v.slug}
            type="button"
            onClick={() => onSelect(v.slug)}
            className="rounded-lg border p-3 text-sm text-center hover:bg-muted hover:border-primary/50 transition-colors"
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function BenchmarksContent({ funnelId }: { funnelId: string }) {
  const [vertical, setVertical] = useState<string | null>(null)

  const { data: savedVertical } = trpc.benchmarks.getVertical.useQuery({ funnelId })
  const { data: benchmarkData, isLoading } = trpc.benchmarks.compare.useQuery(
    { funnelId, vertical: vertical ?? savedVertical ?? '' },
    { enabled: Boolean(vertical ?? savedVertical) },
  )

  const setVerticalMutation = trpc.benchmarks.setVertical.useMutation()
  const utils = trpc.useUtils()

  function handleSelectVertical(slug: string) {
    setVertical(slug)
    setVerticalMutation.mutate(
      { funnelId, vertical: slug },
      { onSuccess: () => utils.benchmarks.getVertical.invalidate({ funnelId }) },
    )
  }

  const activeVertical = vertical ?? savedVertical

  if (!activeVertical) {
    return <VerticalPrompt onSelect={handleSelectVertical} />
  }

  if (isLoading) {
    return <BenchmarksSkeleton />
  }

  const metrics = (benchmarkData?.metrics ?? []) as BenchmarkMetric[]

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Benchmarks do Mercado</h3>
            <p className="text-xs text-muted-foreground">Sua taxa vs media do mercado</p>
          </div>
        </div>
        <VerticalSelector selected={activeVertical} onSelect={handleSelectVertical} />
      </div>

      {metrics.length === 0 ? (
        <div className="text-center py-6">
          <BarChart3 className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Dados insuficientes para{' '}
            {VERTICALS.find((v) => v.slug === activeVertical)?.label ?? activeVertical}
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {metrics.map((metric) => (
            <BenchmarkRow key={metric.metricKey} metric={metric} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function BenchmarksCard({ funnelId }: { funnelId: string }) {
  return (
    <FeatureGate feature="benchmarks">
      <BenchmarksContent funnelId={funnelId} />
    </FeatureGate>
  )
}
