'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, TrendingDown, TrendingUp, DollarSign, AlertTriangle, Award } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'

const insightIcons: Record<string, typeof TrendingDown> = {
  CONVERSION_DROP: TrendingDown,
  CONVERSION_SPIKE: TrendingUp,
  FUNNEL_BOTTLENECK: AlertTriangle,
  SPEND_ANOMALY: DollarSign,
  MILESTONE: Award,
}

const insightColors: Record<string, string> = {
  CONVERSION_DROP: 'text-red-500',
  CONVERSION_SPIKE: 'text-green-500',
  FUNNEL_BOTTLENECK: 'text-yellow-500',
  SPEND_ANOMALY: 'text-orange-500',
  MILESTONE: 'text-blue-500',
}

function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}d`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: unreadCount = 0 } = trpc.insights.unreadCount.useQuery(undefined, {
    refetchInterval: 60000, // check every minute
  })
  const { data: recentInsights = [] } = trpc.insights.list.useQuery(
    { limit: 5, unreadOnly: false },
    { enabled: open }
  )
  const markAllRead = trpc.insights.markAllRead.useMutation()
  const utils = trpc.useUtils()

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleOpen() {
    setOpen(!open)
    if (!open && unreadCount > 0) {
      markAllRead.mutate(undefined, {
        onSuccess: () => {
          utils.insights.unreadCount.invalidate()
        },
      })
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label={`Notificacoes${unreadCount > 0 ? ` (${unreadCount} nao lidas)` : ''}`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 rounded-lg border bg-card shadow-lg z-50">
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Notificacoes</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {recentInsights.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma notificacao ainda.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Insights aparecem aqui conforme seus funis coletam dados.
                </p>
              </div>
            ) : (
              recentInsights.map((insight) => {
                const Icon = insightIcons[insight.type] ?? AlertTriangle
                const color = insightColors[insight.type] ?? 'text-muted-foreground'
                return (
                  <div
                    key={insight.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors',
                      !insight.readAt && 'bg-primary/5'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{insight.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {timeAgo(insight.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          {recentInsights.length > 0 && (
            <div className="px-4 py-2 border-t">
              <a
                href="/dashboard"
                className="text-xs text-primary hover:underline font-medium"
              >
                Ver todos os insights
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
