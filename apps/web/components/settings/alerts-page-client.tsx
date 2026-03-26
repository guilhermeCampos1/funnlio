'use client'

import { useState } from 'react'
import {
  Bell,
  BellOff,
  Mail,
  TrendingDown,
  TrendingUp,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  Crown,
} from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import { FeatureGate } from '@/components/billing/feature-gate'

// ---------------------------------------------------------------------------
// Alert type config
// ---------------------------------------------------------------------------

interface AlertTypeConfig {
  key: string
  label: string
  description: string
  icon: typeof TrendingDown
  iconColor: string
}

const ALERT_TYPES: AlertTypeConfig[] = [
  {
    key: 'conversion_drop',
    label: 'Queda de Conversao',
    description: 'Alerta quando uma taxa de conversao cai significativamente entre periodos.',
    icon: TrendingDown,
    iconColor: 'text-red-500',
  },
  {
    key: 'conversion_spike',
    label: 'Pico de Conversao',
    description: 'Notifica quando uma metrica sobe acima do esperado — pode indicar uma campanha de sucesso.',
    icon: TrendingUp,
    iconColor: 'text-green-500',
  },
  {
    key: 'spend_anomaly',
    label: 'Anomalia de Gasto',
    description: 'Detecta gastos fora do padrao em campanhas de ads conectadas.',
    icon: DollarSign,
    iconColor: 'text-yellow-500',
  },
  {
    key: 'sync_failed',
    label: 'Sync Falhou',
    description: 'Avisa quando uma coleta de metricas falha em uma ou mais integracoes.',
    icon: RefreshCw,
    iconColor: 'text-orange-500',
  },
  {
    key: 'integration_error',
    label: 'Erro de Integracao',
    description: 'Alerta sobre tokens expirados, APIs fora do ar ou problemas de conexao.',
    icon: AlertTriangle,
    iconColor: 'text-red-400',
  },
]

// ---------------------------------------------------------------------------
// Toggle switch
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        checked ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Alert row
// ---------------------------------------------------------------------------

function AlertRow({
  config,
  enabled,
  emailEnabled,
  slackEnabled,
  onToggle,
  isPending,
}: {
  config: AlertTypeConfig
  enabled: boolean
  emailEnabled: boolean
  slackEnabled: boolean
  onToggle: (field: 'enabled' | 'emailEnabled' | 'slackEnabled', value: boolean) => void
  isPending: boolean
}) {
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border p-4 transition-colors',
        !enabled && 'opacity-60 bg-muted/30',
      )}
    >
      {/* Icon + Info */}
      <div className="flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
          <Icon className={cn('w-4 h-4', config.iconColor)} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{config.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {config.description}
        </p>
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-6 flex-shrink-0">
        {/* Enable toggle */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Ativo
          </span>
          <Toggle
            checked={enabled}
            onChange={(v) => onToggle('enabled', v)}
            disabled={isPending}
            label={`Ativar ${config.label}`}
          />
        </div>

        {/* Email toggle */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Mail className="w-3 h-3" />
            Email
          </span>
          <Toggle
            checked={emailEnabled && enabled}
            onChange={(v) => onToggle('emailEnabled', v)}
            disabled={isPending || !enabled}
            label={`Email para ${config.label}`}
          />
        </div>

        {/* Slack toggle (Pro badge if locked) */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            Slack
            <span className="rounded-full bg-purple-100 text-purple-700 px-1.5 py-px text-[9px] font-medium flex items-center gap-0.5">
              <Crown className="w-2.5 h-2.5" />
              Pro
            </span>
          </span>
          <Toggle
            checked={slackEnabled && enabled}
            onChange={(v) => onToggle('slackEnabled', v)}
            disabled={isPending || !enabled}
            label={`Slack para ${config.label}`}
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function AlertsPageSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      <div className="h-4 w-72 bg-muted animate-pulse rounded" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function AlertsPageContent() {
  const { data: settings, isLoading } = trpc.alerts.getSettings.useQuery()
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set())
  const utils = trpc.useUtils()

  const updateSetting = trpc.alerts.updateSetting.useMutation({
    onMutate: ({ alertType }) => {
      setPendingKeys((prev) => new Set(prev).add(alertType))
    },
    onSettled: (_data, _error, { alertType }) => {
      setPendingKeys((prev) => {
        const next = new Set(prev)
        next.delete(alertType)
        return next
      })
      utils.alerts.getSettings.invalidate()
    },
  })

  if (isLoading || !settings) {
    return <AlertsPageSkeleton />
  }

  // Build a map of alert type -> settings
  const settingsMap = new Map(
    settings.map((s) => [s.alertType, s])
  )

  function handleToggle(alertType: string, field: 'enabled' | 'emailEnabled' | 'slackEnabled', value: boolean) {
    updateSetting.mutate({
      alertType,
      [field]: value,
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Alertas</h1>
          <Bell className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground mt-1">
          Configure quais alertas voce quer receber e por qual canal.
        </p>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {ALERT_TYPES.map((config) => {
          const setting = settingsMap.get(config.key)
          return (
            <AlertRow
              key={config.key}
              config={config}
              enabled={setting?.enabled ?? true}
              emailEnabled={setting?.emailEnabled ?? true}
              slackEnabled={setting?.slackEnabled ?? false}
              onToggle={(field, value) => handleToggle(config.key, field, value)}
              isPending={pendingKeys.has(config.key)}
            />
          )
        })}
      </div>

      {/* Info text */}
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground flex items-start gap-3">
        <BellOff className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p>
            Alertas sao gerados automaticamente com base nos dados coletados das suas integracoes.
            A frequencia depende do intervalo de sincronizacao do seu plano.
          </p>
          <p className="mt-1">
            Alertas via Slack estao disponiveis no plano <span className="font-medium text-foreground">Pro</span> ou superior.
          </p>
        </div>
      </div>
    </div>
  )
}

export function AlertsPageClient() {
  return (
    <FeatureGate feature="alerts_email">
      <AlertsPageContent />
    </FeatureGate>
  )
}
