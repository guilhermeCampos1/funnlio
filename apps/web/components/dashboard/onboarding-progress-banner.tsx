'use client'

import { trpc } from '@/lib/trpc'
import { ArrowRight, Plug, GitBranch, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export function OnboardingProgressBanner() {
  const { data: integrations, isLoading: loadingInt } = trpc.integrations.list.useQuery()
  const { data: funnels, isLoading: loadingFunnels } = trpc.funnels.list.useQuery()
  const { data: valueMetrics, isLoading: loadingMetrics } = trpc.valueMetrics.getMonthlyValue.useQuery()

  if (loadingInt || loadingFunnels || loadingMetrics) return null

  const hasIntegration = (integrations?.length ?? 0) > 0
  const hasFunnel = (funnels?.length ?? 0) > 0
  const hasSynced = (valueMetrics?.daysOfData ?? 0) > 0

  // FVM atingido — não exibir
  if (hasIntegration && hasFunnel && hasSynced) return null

  let IconComponent = Plug
  let message = 'Conecte sua primeira ferramenta para o Funnlio começar a coletar dados.'
  let href = '/integrations'
  let cta = 'Conectar ferramenta'

  if (hasIntegration && !hasFunnel) {
    IconComponent = GitBranch
    message = 'Agora crie seu primeiro funil e mapeie as etapas da sua jornada.'
    href = '/dashboard'
    cta = 'Criar funil'
  } else if (hasIntegration && hasFunnel && !hasSynced) {
    IconComponent = RefreshCw
    message = 'Tudo pronto. Sincronize para ver as taxas de conversão do seu funil.'
    href = `/funnels/${funnels?.[0]?.id ?? ''}`
    cta = 'Ver funil'
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <IconComponent className="w-4 h-4 text-primary" />
      </div>
      <p className="flex-1 text-sm text-foreground">{message}</p>
      <Link
        href={href}
        className="flex items-center gap-1 text-sm font-medium text-primary hover:underline flex-shrink-0"
      >
        {cta}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
