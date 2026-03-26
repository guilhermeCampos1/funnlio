'use client'

import { AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface SoftLimitBannerProps {
  resource: string
  current: number
  limit: number
  upgradePlan: string
  upgradeLimit: number | string
}

export function SoftLimitBanner({ resource, current, limit, upgradePlan, upgradeLimit }: SoftLimitBannerProps) {
  const percentage = (current / limit) * 100
  if (percentage < 80) return null

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 px-4 py-3 flex items-center gap-3">
      <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
      <p className="text-sm text-yellow-800 dark:text-yellow-200 flex-1">
        Usando <span className="font-semibold">{current}/{limit}</span> {resource}.
        {' '}O {upgradePlan} oferece {typeof upgradeLimit === 'number' && isFinite(upgradeLimit) ? upgradeLimit : 'ilimitados'}.
      </p>
      <Link
        href="/settings/billing"
        className="text-sm font-medium text-yellow-700 dark:text-yellow-300 hover:underline flex items-center gap-1 flex-shrink-0"
      >
        Upgrade <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
