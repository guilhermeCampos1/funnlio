'use client'

import { Lock, Zap } from 'lucide-react'
import type { Plan } from '@funnlio/shared'
import { cn } from '@/lib/utils'

const planLabels: Record<Plan, string> = {
  trial: 'Trial',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

const planColors: Record<Plan, string> = {
  trial: 'bg-blue-100 text-blue-700',
  starter: 'bg-green-100 text-green-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
}

interface LockedFeatureOverlayProps {
  label: string
  value: string
  requiredPlan: Plan
  children?: React.ReactNode // optional content to blur behind
}

export function LockedFeatureOverlay({ label, value, requiredPlan, children }: LockedFeatureOverlayProps) {
  return (
    <div className="relative rounded-lg border bg-card overflow-hidden" role="alert" aria-label={`${label} - disponível no plano ${planLabels[requiredPlan]}`}>
      {/* Blurred content behind */}
      {children && (
        <div className="blur-sm pointer-events-none select-none p-4">
          {children}
        </div>
      )}

      {/* Overlay — value-first hierarchy */}
      <div className={cn(
        'flex flex-col items-center justify-center gap-3 p-8 text-center',
        children ? 'absolute inset-0 bg-card/80 backdrop-blur-sm' : ''
      )}>
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Lock className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-muted-foreground text-xs mt-1 max-w-xs">{value}</p>
          <h3 className="font-semibold text-sm mt-1.5">{label}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', planColors[requiredPlan])}>
            {planLabels[requiredPlan]}
          </span>
        </div>
        <a
          href="/settings/billing"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          Fazer Upgrade
        </a>
      </div>
    </div>
  )
}
