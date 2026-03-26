'use client'

import { cn } from '@/lib/utils'

interface UsageMeterProps {
  label: string
  current: number
  limit: number
  unit?: string
}

export function UsageMeter({ label, current, limit, unit }: UsageMeterProps) {
  const isUnlimited = !isFinite(limit)
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100)

  const barColor = percentage >= 80 ? 'bg-red-500' : percentage >= 60 ? 'bg-yellow-500' : 'bg-green-500'
  const isAtLimit = percentage >= 100 && !isUnlimited

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {current} / {isUnlimited ? '\u221E' : limit}{unit ? ` ${unit}` : ''}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={isUnlimited ? undefined : limit}
          aria-label={`${label}: ${current} de ${isUnlimited ? 'ilimitado' : limit}`}
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            barColor,
            isAtLimit && 'animate-pulse'
          )}
          style={{ width: isUnlimited ? '0%' : `${percentage}%` }}
        />
      </div>
      {isAtLimit && (
        <p className="text-xs text-red-600 font-medium">
          Limite atingido. <a href="/settings/billing" className="underline font-semibold">Faça upgrade agora</a>
        </p>
      )}
      {percentage >= 80 && !isUnlimited && !isAtLimit && (
        <p className="text-xs text-red-600">
          Você está próximo do limite. <a href="/settings/billing" className="underline font-medium">Upgrade</a>
        </p>
      )}
    </div>
  )
}
