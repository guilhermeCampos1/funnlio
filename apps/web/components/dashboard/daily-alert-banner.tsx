'use client'

import { trpc } from '@/lib/trpc'
import { TrendingDown } from 'lucide-react'
import Link from 'next/link'

export function DailyAlertBanner() {
  const { data: insights } = trpc.insights.list.useQuery({ limit: 5 })

  const topDrop = insights?.find(
    (i) => i.type === 'conversion_drop' && i.severity === 'critical' && !i.readAt
  ) ?? insights?.find(
    (i) => i.type === 'conversion_drop' && !i.readAt
  )

  if (!topDrop) return null

  return (
    <Link href={topDrop.funnelId ? `/funnels/${topDrop.funnelId}` : '/dashboard'}>
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 px-4 py-3 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
          <TrendingDown className="w-4 h-4 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">{topDrop.title}</p>
          {topDrop.description && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 line-clamp-1">
              {topDrop.description}
            </p>
          )}
        </div>
        <span className="text-xs font-medium text-red-600 dark:text-red-400 flex-shrink-0">
          Ver funil →
        </span>
      </div>
    </Link>
  )
}
