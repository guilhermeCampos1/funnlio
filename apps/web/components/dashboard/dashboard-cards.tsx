'use client'

import { ValueCard } from './value-card'
import { InsightsCard } from './insights-card'
import { TrialProgressCard } from '@/components/billing/trial-progress-card'

export function DashboardCards() {
  return (
    <div className="space-y-4">
      <ValueCard />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InsightsCard />
        <TrialProgressCard />
      </div>
    </div>
  )
}
