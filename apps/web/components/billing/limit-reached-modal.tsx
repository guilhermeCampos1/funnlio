'use client'

import { useState } from 'react'
import { AlertTriangle, Zap, X, Loader2 } from 'lucide-react'
import type { Plan } from '@funnlio/shared'

interface LimitReachedModalProps {
  isOpen: boolean
  onClose: () => void
  resource: string // "funis", "integrações", "membros"
  current: number
  limit: number
  upgradePlan: Plan
  upgradeLimit: number
}

const planPrices: Record<Plan, string> = {
  free: 'Grátis',
  trial: 'Grátis',
  starter: 'R$97/mês',
  pro: 'R$247/mês',
  enterprise: 'Sob consulta',
}

export function LimitReachedModal({
  isOpen,
  onClose,
  resource,
  current,
  limit,
  upgradePlan,
  upgradeLimit,
}: LimitReachedModalProps) {
  const [isNavigating, setIsNavigating] = useState(false)

  if (!isOpen) return null

  const handleUpgradeClick = () => {
    setIsNavigating(true)
    window.location.href = '/settings/billing'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-lg border shadow-lg p-6 max-w-md w-full mx-4 space-y-4">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold">Limite de {resource} atingido</h3>
            <p className="text-sm text-muted-foreground">
              Você usa {current} de {limit} {resource}.
            </p>
          </div>
        </div>

        <div className="rounded-md bg-muted/50 p-4">
          <p className="text-sm">
            Com o plano <span className="font-semibold capitalize">{upgradePlan}</span>, você tem até{' '}
            <span className="font-semibold">{isFinite(upgradeLimit) ? upgradeLimit : 'ilimitados'}</span> {resource}.
          </p>
          <p className="text-xs text-muted-foreground mt-1">A partir de {planPrices[upgradePlan]}</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-3">
            <button
              onClick={handleUpgradeClick}
              disabled={isNavigating}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isNavigating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Fazer Upgrade
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md border text-sm hover:bg-muted transition-colors"
            >
              Gerenciar existentes
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Ou gerencie seus recursos atuais
          </button>
        </div>
      </div>
    </div>
  )
}
