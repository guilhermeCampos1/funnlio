'use client'

import { trpc } from '@/lib/trpc'
import { DollarSign, Users, AlertTriangle, Activity, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminOverviewClient() {
  const { data: overview } = trpc.admin.overview.useQuery()
  const { data: healthSummary } = trpc.customerHealth.summary.useQuery()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Painel Admin</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={DollarSign}
          label="MRR Estimado"
          value={overview ? `R$ ${((overview.totalOrgs ?? 0) * 147).toLocaleString('pt-BR')}` : '—'}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <MetricCard
          icon={Users}
          label="Organizações"
          value={overview?.totalOrgs?.toString() ?? '0'}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <MetricCard
          icon={Activity}
          label="Jobs (24h)"
          value={overview?.jobsLast24h?.toString() ?? '0'}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Erros (24h)"
          value={overview?.failedJobsLast24h?.toString() ?? '0'}
          color="text-red-600"
          bgColor="bg-red-50"
        />
      </div>

      {/* C.H.I. Summary */}
      {healthSummary && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="font-semibold text-base mb-4">Customer Health Index</h2>
          <div className="grid grid-cols-4 gap-4">
            <HealthSegment label="Purple" count={healthSummary.purple.count} avgScore={healthSummary.purple.avgScore} color="bg-purple-500" />
            <HealthSegment label="Green" count={healthSummary.green.count} avgScore={healthSummary.green.avgScore} color="bg-green-500" />
            <HealthSegment label="Yellow" count={healthSummary.yellow.count} avgScore={healthSummary.yellow.avgScore} color="bg-yellow-500" />
            <HealthSegment label="Red" count={healthSummary.red.count} avgScore={healthSummary.red.avgScore} color="bg-red-500" />
          </div>
        </div>
      )}

      {/* Growth Ceiling Calculator */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="font-semibold text-base mb-4">Growth Ceiling (4-Number Formula)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Novos clientes/mês</p>
            <p className="text-lg font-bold">—</p>
          </div>
          <div>
            <p className="text-muted-foreground">ARPA</p>
            <p className="text-lg font-bold">—</p>
          </div>
          <div>
            <p className="text-muted-foreground">Churn Rate</p>
            <p className="text-lg font-bold">—</p>
          </div>
          <div>
            <p className="text-muted-foreground">Growth Ceiling</p>
            <p className="text-lg font-bold">—</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Dados populados automaticamente após os primeiros meses de operação.</p>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, color, bgColor }: { icon: typeof DollarSign; label: string; value: string; color: string; bgColor: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center mb-2', bgColor)}>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function HealthSegment({ label, count, avgScore, color }: { label: string; count: number; avgScore: number; color: string }) {
  return (
    <div className="text-center">
      <div className={cn('w-4 h-4 rounded-full mx-auto mb-2', color)} />
      <p className="text-lg font-bold">{count}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">Avg: {Math.round(avgScore)}</p>
    </div>
  )
}
