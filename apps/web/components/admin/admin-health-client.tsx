'use client'

import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import { PlanBadge } from '@/components/billing/plan-badge'
import type { Plan } from '@funnlio/shared'
import { Heart, Activity, AlertTriangle, Mail } from 'lucide-react'

const segmentColors = {
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
}

export function AdminHealthClient() {
  const { data: healthList, isLoading } = trpc.customerHealth.list.useQuery()
  const { data: summary } = trpc.customerHealth.summary.useQuery()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Heart className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Customer Health Index</h1>
      </div>

      {/* Segment summary */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          {(['purple', 'green', 'yellow', 'red'] as const).map((seg) => {
            const data = summary[seg]
            const colors = segmentColors[seg]
            return (
              <div key={seg} className={cn('rounded-lg border p-4 text-center', colors.border)}>
                <div className={cn('w-3 h-3 rounded-full mx-auto mb-2', colors.bg.replace('100', '500'))} />
                <p className="text-2xl font-bold">{data.count}</p>
                <p className="text-xs text-muted-foreground capitalize">{seg}</p>
                <p className="text-xs text-muted-foreground">Score médio: {Math.round(data.avgScore)}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Health list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}
        </div>
      ) : healthList && healthList.length > 0 ? (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Organização</th>
                <th className="text-left p-3 font-medium">Plano</th>
                <th className="text-center p-3 font-medium">Score</th>
                <th className="text-center p-3 font-medium">Segmento</th>
                <th className="text-center p-3 font-medium">Logins (30d)</th>
                <th className="text-center p-3 font-medium">Funis</th>
                <th className="text-center p-3 font-medium">Features</th>
                <th className="text-center p-3 font-medium">Último Sync</th>
                <th className="text-center p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {healthList.map((h) => {
                const colors = segmentColors[h.segment as keyof typeof segmentColors] ?? segmentColors.green
                return (
                  <tr key={h.organizationId} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-medium">{h.organizationName}</td>
                    <td className="p-3"><PlanBadge plan={h.plan as Plan} /></td>
                    <td className="p-3 text-center font-bold">{h.score}</td>
                    <td className="p-3 text-center">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', colors.bg, colors.text)}>
                        {h.segment}
                      </span>
                    </td>
                    <td className="p-3 text-center">{h.loginFrequency}</td>
                    <td className="p-3 text-center">{h.activeFunnels}</td>
                    <td className="p-3 text-center">{h.featuresUsed}</td>
                    <td className="p-3 text-center text-muted-foreground">
                      {h.daysSinceLastSync != null ? `${h.daysSinceLastSync}d` : '—'}
                    </td>
                    <td className="p-3 text-center">
                      {h.segment === 'yellow' && (
                        <a
                          href={`mailto:?subject=Reengajamento — ${h.organizationName}`}
                          className="inline-flex items-center gap-1 text-xs text-yellow-700 hover:text-yellow-900 font-medium"
                        >
                          <Mail className="w-3 h-3" />
                          Enviar email de reengajamento
                        </a>
                      )}
                      {h.segment === 'red' && (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            Ação urgente
                          </span>
                          {h.daysSinceLastSync != null && (
                            <span className="text-[10px] text-muted-foreground">
                              Última atividade: {h.daysSinceLastSync}d atrás
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground">Dados de saúde serão calculados automaticamente.</p>
      )}
    </div>
  )
}
