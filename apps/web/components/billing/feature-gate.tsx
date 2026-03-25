'use client'

import { trpc } from '@/lib/trpc'
import { LockedFeatureOverlay } from './locked-feature-overlay'
import { FEATURE_GATES, hasFeatureAccess } from '@funnlio/shared'
import type { Plan } from '@funnlio/shared'

interface FeatureGateProps {
  feature: string // key from FEATURE_GATES
  children: React.ReactNode
  fallback?: React.ReactNode // optional custom fallback
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { data: subscription } = trpc.billing.getSubscription.useQuery()

  if (!subscription) return null // loading

  const plan = subscription.plan as Plan
  const trialExpired = subscription.trialExpired ?? false

  if (hasFeatureAccess(plan, feature, trialExpired)) {
    return <>{children}</>
  }

  const gate = FEATURE_GATES[feature]
  if (!gate) return <>{children}</> // unknown feature, allow

  if (fallback) return <>{fallback}</>

  return (
    <LockedFeatureOverlay
      label={gate.label}
      value={gate.value}
      requiredPlan={gate.requiredPlan}
    />
  )
}
