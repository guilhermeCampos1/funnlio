'use client'

import { useEffect, useState } from 'react'
import { Check, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc'

interface Step {
  label: string
  done: boolean
  href: string
}

export function SetupProgress() {
  const [mounted, setMounted] = useState(false)
  const { data: integrations } = trpc.integrations.list.useQuery()
  const { data: funnels } = trpc.funnels.list.useQuery()

  useEffect(() => { setMounted(true) }, [])

  if (integrations === undefined || funnels === undefined) return null

  const hasIntegration = integrations.length > 0
  const hasFunnel = funnels.length > 0
  const hasStages = funnels.some((f) => f.stageCount > 0)
  const hasMetrics = funnels.some((f) => f.lastSyncedAt !== null)

  if (hasMetrics) return null

  const steps: Step[] = [
    { label: 'Conta', done: true, href: '#' },
    { label: 'Integração', done: hasIntegration, href: '/integrations' },
    { label: 'Funil', done: hasFunnel, href: '/dashboard' },
    { label: 'Etapas', done: hasStages, href: hasFunnel ? `/funnels/${funnels[0]?.id}` : '/dashboard' },
  ]

  const completedCount = steps.filter((s) => s.done).length
  const nextStep = steps.find((s) => !s.done)
  const progress = (completedCount / steps.length) * 100

  if (completedCount === steps.length) return null

  return (
    <div
      className={`relative overflow-hidden border-b transition-all duration-700 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
      style={{
        background: 'linear-gradient(135deg, hsl(var(--primary) / 0.03) 0%, hsl(var(--primary) / 0.08) 100%)',
      }}
    >
      {/* Animated glow line */}
      <div className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-primary/0 via-primary to-primary/0 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />

      <div className="container mx-auto max-w-7xl px-6 py-3">
        <div className="flex items-center justify-between gap-6">
          {/* Steps */}
          <div className="flex items-center gap-1 flex-1">
            {steps.map((step, i) => {
              const isActive = !step.done && steps.slice(0, i).every((s) => s.done)
              return (
                <div key={i} className="flex items-center">
                  {/* Step node */}
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                        transition-all duration-500
                        ${step.done
                          ? 'bg-primary text-primary-foreground scale-100'
                          : isActive
                            ? 'bg-primary/20 text-primary ring-2 ring-primary/30 ring-offset-1 animate-pulse'
                            : 'bg-muted text-muted-foreground'
                        }
                      `}
                    >
                      {step.done ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium transition-colors duration-300 ${
                        step.done ? 'text-primary' : isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="mx-2 flex-shrink-0">
                      <div
                        className={`w-8 h-[2px] rounded-full transition-all duration-700 ${
                          step.done ? 'bg-primary' : 'bg-muted-foreground/20'
                        }`}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* CTA */}
          {nextStep && (
            <Link
              href={nextStep.href}
              className="
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                bg-primary text-primary-foreground text-xs font-medium
                hover:bg-primary/90 transition-all duration-200
                hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02]
                active:scale-[0.98]
                flex-shrink-0
              "
            >
              <Zap className="w-3 h-3" />
              Próximo passo
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
