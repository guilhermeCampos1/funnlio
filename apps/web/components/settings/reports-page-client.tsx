'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Mail, Clock, Plus, X, FileText, BarChart3, Lightbulb, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FeatureGate } from '@/components/billing/feature-gate'

type ReportFrequency = 'daily' | 'weekly' | 'monthly'

interface ReportSectionProps {
  frequency: ReportFrequency
  title: string
  description: string
  featureGate?: string
  defaultOpen?: boolean
}

function ReportSection({ frequency, title, description, featureGate, defaultOpen }: ReportSectionProps) {
  const { data: allSettings, isLoading } = trpc.reports.getSettings.useQuery()
  const { data: funnels = [] } = trpc.funnels.list.useQuery()
  const upsertSetting = trpc.reports.upsertSetting.useMutation()
  const utils = trpc.useUtils()

  const [newEmail, setNewEmail] = useState('')

  const settings = allSettings?.find((s) => s.frequency === frequency)

  const enabled = settings?.enabled ?? false
  const recipients: string[] = (settings?.recipients as string[]) ?? []
  const includeInsights = settings?.includeInsights ?? false
  const includeMetrics = settings?.includeMetrics ?? true
  const sendTime = settings?.sendTime ?? '08:00'

  const handleUpdate = async (updates: Record<string, unknown>) => {
    await upsertSetting.mutateAsync({
      frequency,
      enabled: updates.enabled !== undefined ? (updates.enabled as boolean) : enabled,
      recipients: updates.recipients !== undefined ? (updates.recipients as string[]) : recipients,
      includeInsights: updates.includeInsights !== undefined ? (updates.includeInsights as boolean) : includeInsights,
      includeMetrics: updates.includeMetrics !== undefined ? (updates.includeMetrics as boolean) : includeMetrics,
      sendTime: updates.sendTime !== undefined ? (updates.sendTime as string) : sendTime,
    })
    utils.reports.getSettings.invalidate()
  }

  const handleAddEmail = async () => {
    const email = newEmail.trim()
    if (!email || recipients.includes(email)) return
    await handleUpdate({ recipients: [...recipients, email] })
    setNewEmail('')
  }

  const handleRemoveEmail = async (email: string) => {
    await handleUpdate({ recipients: recipients.filter((r) => r !== email) })
  }

  const content = (
    <details open={defaultOpen || enabled} className="group rounded-lg border bg-card">
      <summary className="flex items-center justify-between p-5 cursor-pointer list-none select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">{title}</h3>
              {enabled && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Ativo
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.preventDefault()
              handleUpdate({ enabled: !enabled })
            }}
            disabled={upsertSetting.isPending}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              enabled ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                enabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </div>
      </summary>

      <div className={cn('px-5 pb-5 space-y-4', !enabled && 'opacity-60 pointer-events-none')}>
        {isLoading ? (
          <div className="h-32 bg-muted rounded animate-pulse" />
        ) : (
          <>
            {/* Funnel scope */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Quais funis incluir?
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  className="rounded-md border border-primary bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary"
                >
                  Todos os funis
                </button>
                {funnels.map((funnel) => (
                  <span
                    key={funnel.id}
                    className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground"
                  >
                    {funnel.name}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Por enquanto todos os funis sao incluidos. Filtragem por funil em breve.
              </p>
            </div>

            {/* Recipients */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Destinatarios (email)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {recipients.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
                  >
                    {email}
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                  placeholder="email@exemplo.com"
                  className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
                />
                <button
                  onClick={handleAddEmail}
                  disabled={!newEmail.trim()}
                  className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content toggles */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleUpdate({ includeMetrics: !includeMetrics })}
                className={cn(
                  'flex items-center gap-2 rounded-md border p-3 text-left transition-colors',
                  includeMetrics ? 'border-primary bg-primary/5' : 'border-muted'
                )}
              >
                <BarChart3 className={cn('w-4 h-4', includeMetrics ? 'text-primary' : 'text-muted-foreground')} />
                <span className="text-xs font-medium">Incluir metricas</span>
              </button>
              <button
                onClick={() => handleUpdate({ includeInsights: !includeInsights })}
                className={cn(
                  'flex items-center gap-2 rounded-md border p-3 text-left transition-colors',
                  includeInsights ? 'border-primary bg-primary/5' : 'border-muted'
                )}
              >
                <Lightbulb className={cn('w-4 h-4', includeInsights ? 'text-primary' : 'text-muted-foreground')} />
                <span className="text-xs font-medium">Incluir insights</span>
              </button>
            </div>

            {/* Send time */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Horario de envio
              </label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <input
                  type="time"
                  value={sendTime}
                  onChange={(e) => handleUpdate({ sendTime: e.target.value })}
                  className="rounded-md border bg-background px-3 py-1.5 text-sm"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </details>
  )

  if (featureGate) {
    return <FeatureGate feature={featureGate}>{content}</FeatureGate>
  }

  return content
}

export function ReportsPageClient() {
  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-5 h-5 text-primary" />
        <div>
          <h1 className="text-xl font-bold">Relatorios Automaticos</h1>
          <p className="text-sm text-muted-foreground">
            Configure relatorios para acompanhar seus funis por email.
            Voce tambem pode visualizar relatorios diretamente em <a href="/reports" className="text-primary hover:underline">/relatorios</a>.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <ReportSection
          frequency="daily"
          title="Relatorio Diario"
          description="Resumo das metricas do dia anterior"
          defaultOpen
        />
        <ReportSection
          frequency="weekly"
          title="Relatorio Semanal"
          description="Comparacao semanal com tendencias"
          featureGate="weekly_report"
        />
        <ReportSection
          frequency="monthly"
          title="Relatorio Mensal"
          description="Visao geral mensal com insights detalhados"
          featureGate="monthly_report"
        />
      </div>
    </div>
  )
}
