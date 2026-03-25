'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Mail, Clock, Plus, X, Bell, BarChart3, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FeatureGate } from '@/components/billing/feature-gate'

type ReportFrequency = 'daily' | 'weekly' | 'monthly'

interface ReportSectionProps {
  frequency: ReportFrequency
  title: string
  description: string
  featureGate?: string
}

function ReportSection({ frequency, title, description, featureGate }: ReportSectionProps) {
  const { data: settings, isLoading } = trpc.reports.getSettings.useQuery({ frequency })
  const upsertSetting = trpc.reports.upsertSetting.useMutation()
  const utils = trpc.useUtils()

  const [newEmail, setNewEmail] = useState('')

  const enabled = settings?.enabled ?? false
  const recipients: string[] = settings?.recipients ?? []
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
    utils.reports.getSettings.invalidate({ frequency })
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
    <div className={cn('rounded-lg border bg-card p-5', !enabled && 'opacity-60')}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <button
          onClick={() => handleUpdate({ enabled: !enabled })}
          disabled={upsertSetting.isPending}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            enabled ? 'bg-primary' : 'bg-muted'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              enabled ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>

      {isLoading ? (
        <div className="h-32 bg-muted rounded animate-pulse" />
      ) : (
        <div className="space-y-4">
          {/* Recipients */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Destinatários
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
                disabled={!enabled}
              />
              <button
                onClick={handleAddEmail}
                disabled={!enabled || !newEmail.trim()}
                className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleUpdate({ includeMetrics: !includeMetrics })}
              disabled={!enabled}
              className={cn(
                'flex items-center gap-2 rounded-md border p-3 text-left transition-colors',
                includeMetrics ? 'border-primary bg-primary/5' : 'border-muted'
              )}
            >
              <BarChart3 className={cn('w-4 h-4', includeMetrics ? 'text-primary' : 'text-muted-foreground')} />
              <span className="text-xs font-medium">Incluir métricas</span>
            </button>
            <button
              onClick={() => handleUpdate({ includeInsights: !includeInsights })}
              disabled={!enabled}
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
              Horário de envio
            </label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <input
                type="time"
                value={sendTime}
                onChange={(e) => handleUpdate({ sendTime: e.target.value })}
                disabled={!enabled}
                className="rounded-md border bg-background px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
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
        <Bell className="w-5 h-5 text-primary" />
        <div>
          <h1 className="text-xl font-bold">Relatórios por Email</h1>
          <p className="text-sm text-muted-foreground">
            Configure relatórios automáticos para acompanhar seus funis.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <ReportSection
          frequency="daily"
          title="Relatório Diário"
          description="Resumo das métricas do dia anterior"
        />
        <ReportSection
          frequency="weekly"
          title="Relatório Semanal"
          description="Comparação semanal com tendências"
          featureGate="weekly_report"
        />
        <ReportSection
          frequency="monthly"
          title="Relatório Mensal"
          description="Visão geral mensal com insights detalhados"
          featureGate="monthly_report"
        />
      </div>
    </div>
  )
}
