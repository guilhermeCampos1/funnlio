'use client'

import { trpc } from '@/lib/trpc'
import { Clock, Check, Circle, Zap, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface TrialOutcome {
  key: string
  label: string
  checkFn: (data: TrialCheckData) => boolean
}

interface TrialCheckData {
  hasIntegration: boolean
  hasFunnel: boolean
  hasStage: boolean
  hasSynced: boolean
  hasMultipleMembers: boolean
}

const trialOutcomes: TrialOutcome[] = [
  { key: 'conversion', label: 'Veja a taxa de conversão do seu funil', checkFn: (d) => d.hasIntegration && d.hasSynced },
  { key: 'leaks', label: 'Descubra onde está perdendo mais leads', checkFn: (d) => d.hasFunnel && d.hasStage },
  { key: 'alerts', label: 'Receba alertas quando algo mudar', checkFn: (d) => d.hasSynced },
  { key: 'team', label: 'Compartilhe resultados com seu time', checkFn: (d) => d.hasMultipleMembers },
]

export function TrialProgressCard() {
  const { data: subscription } = trpc.billing.getSubscription.useQuery()
  const { data: usage } = trpc.billing.getUsage.useQuery()
  const { data: valueMetrics } = trpc.valueMetrics.getMonthlyValue.useQuery()

  if (!subscription || subscription.plan !== 'trial' || subscription.trialExpired) return null

  const trialEndsAt = subscription.planExpiresAt ? new Date(subscription.planExpiresAt) : null
  if (!trialEndsAt) return null

  const now = new Date()
  const totalDays = 14
  const daysUsed = Math.ceil((now.getTime() - (trialEndsAt.getTime() - totalDays * 24 * 60 * 60 * 1000)) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.max(0, totalDays - daysUsed)
  const progress = Math.min((daysUsed / totalDays) * 100, 100)

  // Dias 8-11: sumir completamente para não virar contador de pressão
  if (daysUsed > 7 && daysRemaining > 2) return null

  // Build check data from available queries
  const checkData: TrialCheckData = {
    hasIntegration: (usage?.integrations?.current ?? 0) > 0,
    hasFunnel: (usage?.funnels?.current ?? 0) > 0,
    hasStage: (valueMetrics?.totalStages ?? 0) > 0,
    hasSynced: (valueMetrics?.daysOfData ?? 0) > 0,
    hasMultipleMembers: (usage?.members?.current ?? 0) > 1,
  }

  const completedOutcomes = trialOutcomes.filter(f => f.checkFn(checkData))
  const pendingOutcomes = trialOutcomes.filter(f => !f.checkFn(checkData))

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-base">Seu Trial Pro</h2>
        </div>
        <span className="text-sm text-muted-foreground">
          {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''} restante{daysRemaining !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Dia {daysUsed} de {totalDays}</p>
      </div>

      {/* Outcomes checklist */}
      <div className="space-y-2 mb-4">
        {trialOutcomes.map((outcome) => {
          const completed = outcome.checkFn(checkData)
          return (
            <div key={outcome.key} className="flex items-center gap-2 text-sm">
              {completed ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground" />
              )}
              <span className={cn(completed ? 'text-foreground' : 'text-muted-foreground')}>
                {outcome.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Pending outcomes CTA */}
      {pendingOutcomes.length > 0 && (
        <p className="text-xs text-muted-foreground mb-3">
          Experimente antes que o trial acabe: <span className="font-medium">{pendingOutcomes.map(f => f.label).join(', ')}</span>
        </p>
      )}

      <Link
        href="/settings/billing"
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Zap className="w-3.5 h-3.5" />
        Escolha seu plano
      </Link>
    </div>
  )
}
