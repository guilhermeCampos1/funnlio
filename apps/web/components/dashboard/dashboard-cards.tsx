'use client'

import { ValueCard } from './value-card'
import { InsightsCard } from './insights-card'
import { DailyAlertBanner } from './daily-alert-banner'
import { OnboardingProgressBanner } from './onboarding-progress-banner'
import { TrialProgressCard } from '@/components/billing/trial-progress-card'

export function DashboardCards() {
  return (
    <div className="space-y-4">
      <OnboardingProgressBanner />
      <DailyAlertBanner />
      <ValueCard />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InsightsCard />
        <TrialProgressCard />
      </div>
    </div>
  )
}
