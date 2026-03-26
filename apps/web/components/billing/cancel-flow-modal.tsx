'use client'

import { useState } from 'react'
import { X, AlertTriangle, ArrowRight, Pause, MessageSquare, Zap, Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'

interface CancelFlowModalProps {
  isOpen: boolean
  onClose: () => void
}

const cancelReasons = [
  { value: 'too_expensive', label: 'Muito caro para o momento' },
  { value: 'not_using', label: 'Não estou usando o suficiente' },
  { value: 'missing_feature', label: 'Falta uma funcionalidade que preciso' },
  { value: 'switched_tool', label: 'Mudei para outra ferramenta' },
  { value: 'temporary', label: 'Pausa temporária' },
  { value: 'other', label: 'Outro motivo' },
]

export function CancelFlowModal({ isOpen, onClose }: CancelFlowModalProps) {
  const [step, setStep] = useState(1)
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState('')

  const { data: usage } = trpc.billing.getUsage.useQuery()
  const { data: valueMetrics } = trpc.valueMetrics.getMonthlyValue.useQuery()
  const cancelMutation = trpc.billing.cancelSubscription.useMutation()

  if (!isOpen) return null

  const handleCancel = async () => {
    await cancelMutation.mutateAsync({ reason, feedback })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-lg border shadow-lg p-6 max-w-lg w-full mx-4">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={cn(
              'h-1.5 flex-1 rounded-full',
              s <= step ? 'bg-primary' : 'bg-muted'
            )} />
          ))}
        </div>

        {/* Step 1: Why are you leaving? */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Por que você está saindo?</h3>
            <p className="text-sm text-muted-foreground">Seu feedback nos ajuda a melhorar.</p>

            <div className="space-y-2">
              {cancelReasons.map(r => (
                <label key={r.value} className={cn(
                  'flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors',
                  reason === r.value ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                )}>
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="sr-only"
                  />
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2',
                    reason === r.value ? 'border-primary bg-primary' : 'border-muted-foreground'
                  )} />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>

            <textarea
              placeholder="Conte mais sobre o motivo (opcional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] resize-none"
            />

            <button
              onClick={() => setStep(2)}
              disabled={!reason}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Continuar <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
            </button>
          </div>
        )}

        {/* Step 2: Retention offer based on reason */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Antes de ir...</h3>

            {reason === 'too_expensive' && (
              <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950/20 p-4">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Que tal o Starter por R$77/mês (anual)?
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Mantenha até 10 funis e 5 integrações por um preço menor.
                </p>
                <a
                  href="/settings/billing"
                  className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-green-700 dark:text-green-300 hover:underline"
                >
                  <Zap className="w-3 h-3" /> Ver planos
                </a>
              </div>
            )}

            {reason === 'not_using' && (
              <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  <Pause className="w-4 h-4 inline mr-1" /> Que tal pausar por 1 mês?
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Seus dados ficam intactos e você retoma quando quiser.
                </p>
              </div>
            )}

            {reason === 'missing_feature' && (
              <div className="rounded-md border border-purple-200 bg-purple-50 dark:bg-purple-950/20 p-4">
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  <MessageSquare className="w-4 h-4 inline mr-1" /> Obrigado pelo feedback!
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Estamos sempre melhorando. Quer ser notificado quando lançarmos novidades?
                </p>
              </div>
            )}

            {!['too_expensive', 'not_using', 'missing_feature'].includes(reason) && (
              <div className="rounded-md bg-muted/50 p-4">
                <p className="text-sm">Lamentamos ver você ir. Seus dados ficam disponíveis por 90 dias.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Continuar cancelamento
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Manter plano
              </button>
            </div>

            <button
              onClick={() => setStep(step - 1)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Voltar
            </button>
          </div>
        )}

        {/* Step 3: What you lose + final confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-lg">O que você perde</h3>
            </div>

            <div className="rounded-md bg-muted/50 p-4 space-y-3">
              {valueMetrics && valueMetrics.daysOfData > 0 && (
                <p className="text-sm">
                  <span className="font-medium">{valueMetrics.daysOfData} dias</span> de dados históricos congelados
                </p>
              )}
              {usage && (usage.funnels?.current ?? 0) > 0 && (
                <p className="text-sm">
                  <span className="font-medium">{usage.funnels.current} funis ativos</span> serão pausados
                </p>
              )}
              {usage && (usage.integrations?.current ?? 0) > 0 && (
                <p className="text-sm">
                  <span className="font-medium">{usage.integrations.current} integrações</span> desconectadas
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Seus dados ficam congelados por 90 dias. Após isso, serão removidos permanentemente.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="flex-1 rounded-md border border-red-300 text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
              >
                {cancelMutation.isPending ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Cancelando...
                  </span>
                ) : (
                  'Confirmar cancelamento'
                )}
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Manter plano
              </button>
            </div>

            <button
              onClick={() => setStep(step - 1)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
