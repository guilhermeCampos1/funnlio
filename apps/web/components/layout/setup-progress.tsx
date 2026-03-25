'use client'

import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc'

interface Step {
  label: string
  done: boolean
  href: string
}

export function SetupProgress() {
  const { data: integrations } = trpc.integrations.list.useQuery()
  const { data: funnels } = trpc.funnels.list.useQuery()

  // Still loading
  if (integrations === undefined || funnels === undefined) return null

  const hasIntegration = integrations.length > 0
  const hasFunnel = funnels.length > 0
  const hasStages = funnels.some((f) => f.stageCount > 0)
  const hasMetrics = funnels.some((f) => f.lastSyncedAt !== null)

  // If user has reached First Value Moment, hide progress
  if (hasMetrics) return null

  const steps: Step[] = [
    { label: 'Conta criada', done: true, href: '#' },
    { label: 'Ferramenta conectada', done: hasIntegration, href: '/integrations' },
    { label: 'Funil criado', done: hasFunnel, href: '/dashboard' },
    { label: 'Etapas adicionadas', done: hasStages, href: hasFunnel ? `/funnels/${funnels[0]?.id}` : '/dashboard' },
  ]

  const completedCount = steps.filter((s) => s.done).length
  const nextStep = steps.find((s) => !s.done)

  if (completedCount === steps.length) return null

  return (
    <div className="bg-primary/5 border-b px-6 py-3">
      <div className="container mx-auto max-w-7xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="text-xs font-medium text-foreground">
            {completedCount}/{steps.length} passos para ver suas métricas:
          </p>
          <div className="flex items-center gap-1.5">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-1">
                {step.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span className={`text-xs ${step.done ? 'text-green-700' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
                {i < steps.length - 1 && <span className="text-muted-foreground/40 mx-0.5">—</span>}
              </div>
            ))}
          </div>
        </div>

        {nextStep && (
          <Link
            href={nextStep.href}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors flex-shrink-0"
          >
            Continuar
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  )
}
