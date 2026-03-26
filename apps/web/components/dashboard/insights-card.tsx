'use client'

import { trpc } from '@/lib/trpc'
import {
  Lightbulb,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Zap,
  Trophy,
  Check,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const insightIcons = {
  conversion_drop: TrendingDown,
  conversion_spike: TrendingUp,
  funnel_bottleneck: AlertTriangle,
  spend_anomaly: Zap,
  milestone: Trophy,
}

const insightCTAs: Record<string, string> = {
  conversion_drop: 'Ver funil completo',
  conversion_spike: 'Ver o que mudou',
  funnel_bottleneck: 'Ver etapa',
  spend_anomaly: 'Ver campanha',
  milestone: 'Compartilhar',
}

const insightColors = {
  conversion_drop: 'text-red-600 bg-red-50 dark:bg-red-950/30',
  conversion_spike: 'text-green-600 bg-green-50 dark:bg-green-950/30',
  funnel_bottleneck: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30',
  spend_anomaly: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
  milestone: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
}

const severityBorder = {
  info: 'border-l-blue-400',
  warning: 'border-l-yellow-400',
  critical: 'border-l-red-400',
}

export function InsightsCard() {
  const { data: insightsList, isLoading } = trpc.insights.list.useQuery({
    limit: 3,
  })
  const { data: unreadCount } = trpc.insights.unreadCount.useQuery()
  const markRead = trpc.insights.markRead.useMutation()
  const utils = trpc.useUtils()

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 animate-pulse">
        <div className="h-5 w-40 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </div>
    )
  }

  const handleMarkRead = async (id: string) => {
    await markRead.mutateAsync({ id })
    utils.insights.list.invalidate()
    utils.insights.unreadCount.invalidate()
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-base">Insights da Semana</h2>
          {(unreadCount ?? 0) > 0 && (
            <span className="rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {!insightsList || insightsList.length === 0 ? (
        <div className="text-center py-8">
          <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhum insight ainda.
          </p>
          <p className="text-xs text-muted-foreground">
            Insights aparecem conforme seus funis coletam dados.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {insightsList.map((insight) => {
            const Icon =
              insightIcons[insight.type as keyof typeof insightIcons] ??
              Lightbulb
            const colorClasses =
              insightColors[insight.type as keyof typeof insightColors] ??
              'text-blue-600 bg-blue-50'
            const borderClass =
              severityBorder[insight.severity as keyof typeof severityBorder] ??
              'border-l-blue-400'

            return (
              <div
                key={insight.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-md border-l-4 bg-muted/30 hover:bg-muted/50 transition-colors',
                  borderClass,
                  !insight.readAt && 'bg-primary/5'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                    colorClasses
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {insight.description}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs text-muted-foreground">
                      {new Date(insight.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    {insight.funnelId && insightCTAs[insight.type] && (
                      <Link
                        href={`/funnels/${insight.funnelId}`}
                        className="flex items-center gap-0.5 text-xs text-primary hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {insightCTAs[insight.type]}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
                {!insight.readAt && (
                  <button
                    onClick={() => handleMarkRead(insight.id)}
                    className="flex-shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Marcar como lido"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
