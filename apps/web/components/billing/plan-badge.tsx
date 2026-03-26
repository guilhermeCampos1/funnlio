'use client'

import { cn } from '@/lib/utils'
import type { Plan } from '@funnlio/shared'

const planConfig: Record<Plan, { label: string; className: string }> = {
  free: { label: 'Free', className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300' },
  trial: { label: 'Free', className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300' },
  starter: { label: 'Starter', className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  pro: { label: 'Pro', className: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  enterprise: { label: 'Enterprise', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
}

interface PlanBadgeProps {
  plan: Plan
  size?: 'sm' | 'md'
}

export function PlanBadge({ plan, size = 'sm' }: PlanBadgeProps) {
  const config = planConfig[plan]
  return (
    <span className={cn(
      'rounded-full font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      config.className
    )}>
      {config.label}
    </span>
  )
}
