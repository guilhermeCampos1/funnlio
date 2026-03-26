'use client'

import { trpc } from '@/lib/trpc'
import { Clock, Zap } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function TrialBanner() {
  const { data: subscription } = trpc.billing.getSubscription.useQuery()
  const { data: valueMetrics } = trpc.valueMetrics.getMonthlyValue.useQuery()

  if (!subscription) return null
  if (subscription.plan !== 'trial') return null

  const trialEndsAt = subscription.planExpiresAt ? new Date(subscription.planExpiresAt) : null
  if (!trialEndsAt) return null

  const now = new Date()
  const daysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  if (daysRemaining <= 0 && !subscription.trialExpired) return null

  // Expired trial
  if (subscription.trialExpired) {
    return (
      <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm">
        <Clock className="w-4 h-4" />
        <span>Trial expirado. Seus dados estão congelados.</span>
        <Link href="/settings/billing" className="font-semibold underline hover:no-underline flex items-center gap-1">
          <Zap className="w-3 h-3" /> Ativar plano
        </Link>
      </div>
    )
  }

  // Active trial with countdown
  const bannerColor = daysRemaining >= 8
    ? 'bg-blue-600 text-white'
    : daysRemaining >= 4
      ? 'bg-yellow-400 text-yellow-950'
      : daysRemaining >= 2
        ? 'bg-orange-500 text-orange-950'
        : 'bg-red-600 text-white'

  // Personalized value message when data is available
  const valueSnippet = valueMetrics && valueMetrics.daysOfData > 0
    ? ` Você já tem ${valueMetrics.daysOfData} dias de dados.`
    : ''

  const message = daysRemaining >= 8
    ? `Você tem ${daysRemaining} dias restantes no trial Pro. Explore tudo!${valueSnippet}`
    : daysRemaining >= 4
      ? `Restam ${daysRemaining} dias do trial.${valueSnippet}`
      : daysRemaining >= 2
        ? `Último${daysRemaining > 1 ? 's' : ''} ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''}! Ative para manter seus dados.${valueSnippet}`
        : `Trial encerra hoje. Dados congelados à meia-noite.${valueSnippet}`

  return (
    <div className={cn('px-4 py-2 flex items-center justify-center gap-3 text-sm', bannerColor)}>
      <Clock className="w-4 h-4" />
      <span>{message}</span>
      <Link href="/settings/billing" className="font-semibold underline hover:no-underline flex items-center gap-1">
        Escolha seu plano <Zap className="w-3 h-3" />
      </Link>
    </div>
  )
}
