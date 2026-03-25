'use client'

import { useState } from 'react'
import {
  Webhook,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import { FeatureGate } from '@/components/billing/feature-gate'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WebhookConfig {
  id: string
  url: string
  events: string
  isActive: boolean
  failureCount: string
  lastTriggeredAt: string | null
  createdAt: string
}

interface WebhookLogEntry {
  id: string
  eventType: string
  responseStatus: string | null
  success: boolean
  createdAt: string
  responseBody: string | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EVENT_TYPES = [
  { key: 'metric_collected', label: 'Metrica Coletada', description: 'Quando novas metricas sao coletadas de uma integracao' },
  { key: 'alert_triggered', label: 'Alerta Disparado', description: 'Quando um alerta e acionado (queda de conversao, anomalia, etc.)' },
  { key: 'funnel_created', label: 'Funil Criado', description: 'Quando um novo funil e criado na organizacao' },
  { key: 'integration_connected', label: 'Integracao Conectada', description: 'Quando uma integracao e conectada com sucesso' },
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label="Copiar"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function WebhooksSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      <div className="h-4 w-72 bg-muted animate-pulse rounded" />
      <div className="h-40 bg-muted animate-pulse rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Created secret banner
// ---------------------------------------------------------------------------

function CreatedSecretBanner({ secret, onDismiss }: { secret: string; onDismiss: () => void }) {
  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800 p-4 space-y-2">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Salve o secret do webhook agora — ele nao sera exibido novamente.
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-md bg-background border px-3 py-2">
            <code className="text-xs font-mono flex-1 break-all select-all">{secret}</code>
            <CopyButton text={secret} />
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground p-1"
          aria-label="Fechar"
        >
          &times;
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Log viewer
// ---------------------------------------------------------------------------

function WebhookLogViewer({ webhookId }: { webhookId: string }) {
  const { data: logs = [], isLoading } = trpc.webhooksConfig.getLogs.useQuery(
    { webhookId, limit: 20 },
  )

  if (isLoading) {
    return (
      <div className="px-5 py-3 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 bg-muted animate-pulse rounded" />
        ))}
      </div>
    )
  }

  if ((logs as unknown as WebhookLogEntry[]).length === 0) {
    return (
      <div className="px-5 py-4 text-sm text-muted-foreground text-center">
        Nenhum log disponivel para este webhook.
      </div>
    )
  }

  return (
    <div className="px-5 py-3">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted-foreground text-left">
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Evento</th>
            <th className="pb-2 font-medium">Codigo</th>
            <th className="pb-2 font-medium">Data</th>
            <th className="pb-2 font-medium">Resposta</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {(logs as unknown as WebhookLogEntry[]).map((log) => (
            <tr key={log.id}>
              <td className="py-2 pr-3">
                {log.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                )}
              </td>
              <td className="py-2 pr-3 font-mono">{log.eventType}</td>
              <td className="py-2 pr-3">{log.responseStatus ?? '-'}</td>
              <td className="py-2 pr-3 text-muted-foreground">
                {new Date(log.createdAt).toLocaleString('pt-BR')}
              </td>
              <td className="py-2 text-muted-foreground truncate max-w-[200px]">
                {log.responseBody ?? '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Webhook row
// ---------------------------------------------------------------------------

function WebhookRow({
  webhook,
  onDelete,
  isDeleting,
}: {
  webhook: WebhookConfig
  onDelete: () => void
  isDeleting: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border-b last:border-b-0">
      <div className="flex items-center gap-4 px-5 py-4">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
          aria-label={expanded ? 'Fechar logs' : 'Ver logs'}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Webhook className={cn('w-4 h-4', webhook.isActive ? 'text-primary' : 'text-muted-foreground')} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono truncate">{webhook.url}</code>
            <span
              className={cn(
                'text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full flex-shrink-0',
                webhook.isActive
                  ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
              )}
            >
              {webhook.isActive ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {webhook.lastTriggeredAt
                ? new Date(webhook.lastTriggeredAt).toLocaleString('pt-BR')
                : 'Nunca disparado'}
            </span>
            {Number(webhook.failureCount) > 0 && (
              <span className="text-xs text-red-600 font-medium">
                {webhook.failureCount} falha{Number(webhook.failureCount) > 1 ? 's' : ''}
              </span>
            )}
            <div className="flex items-center gap-1">
              {(JSON.parse(webhook.events) as string[]).map((evt) => (
                <span
                  key={evt}
                  className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono"
                >
                  {evt}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="bg-muted/30 border-t">
          <WebhookLogViewer webhookId={webhook.id} />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <Webhook className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm font-medium">Nenhum webhook configurado</p>
      <p className="text-xs text-muted-foreground mt-1">
        Webhooks permitem que sistemas externos recebam eventos do Funnlio em tempo real.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function WebhooksPageContent() {
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set())
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const { data: webhooks = [], isLoading } = trpc.webhooksConfig.list.useQuery()

  const createWebhook = trpc.webhooksConfig.create.useMutation({
    onSuccess: (data: { secret: string }) => {
      setCreatedSecret(data.secret)
      setUrl('')
      setSelectedEvents(new Set())
      utils.webhooksConfig.list.invalidate()
    },
  })

  const deleteWebhook = trpc.webhooksConfig.delete.useMutation({
    onSuccess: () => utils.webhooksConfig.list.invalidate(),
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || selectedEvents.size === 0) return
    createWebhook.mutate({
      url: url.trim(),
      events: Array.from(selectedEvents),
    })
  }

  function toggleEvent(key: string) {
    setSelectedEvents((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  if (isLoading) {
    return <WebhooksSkeleton />
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
          <Webhook className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground mt-1">
          Receba notificacoes em tempo real quando eventos ocorrerem no Funnlio.
        </p>
      </div>

      {/* Created secret banner */}
      {createdSecret && (
        <CreatedSecretBanner secret={createdSecret} onDismiss={() => setCreatedSecret(null)} />
      )}

      {/* Create form */}
      <form onSubmit={handleCreate} className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="font-medium text-sm">Criar novo webhook</h2>

        {/* URL */}
        <div>
          <label htmlFor="webhook-url" className="text-xs text-muted-foreground mb-1 block">
            URL de destino
          </label>
          <input
            id="webhook-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://exemplo.com/webhook"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Events */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Eventos</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EVENT_TYPES.map((evt) => (
              <label
                key={evt.key}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                  selectedEvents.has(evt.key)
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50',
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedEvents.has(evt.key)}
                  onChange={() => toggleEvent(evt.key)}
                  className="mt-0.5 rounded border-input"
                />
                <div>
                  <p className="text-sm font-medium">{evt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{evt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {selectedEvents.size} evento{selectedEvents.size !== 1 ? 's' : ''} selecionado{selectedEvents.size !== 1 ? 's' : ''}
          </p>
          <button
            type="submit"
            disabled={createWebhook.isPending || !url.trim() || selectedEvents.size === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {createWebhook.isPending ? 'Criando...' : 'Criar webhook'}
          </button>
        </div>

        {createWebhook.error && (
          <p className="text-sm text-destructive">{createWebhook.error.message}</p>
        )}
      </form>

      {/* Webhooks list */}
      {(webhooks as unknown as WebhookConfig[]).length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-lg border bg-card">
          {(webhooks as unknown as WebhookConfig[]).map((webhook) => (
            <WebhookRow
              key={webhook.id}
              webhook={webhook}
              onDelete={() => {
                if (confirm(`Excluir o webhook para ${webhook.url}?`)) {
                  deleteWebhook.mutate({ id: webhook.id })
                }
              }}
              isDeleting={deleteWebhook.isPending}
            />
          ))}
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground flex items-start gap-3">
        <Webhook className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p>
            Cada requisicao inclui um header <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">X-Funnlio-Signature</code> com
            assinatura HMAC-SHA256 usando o secret do webhook. Use-o para verificar a autenticidade das chamadas.
          </p>
          <p className="mt-1">
            Webhooks que falham 10 vezes consecutivas sao automaticamente desativados.
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function WebhooksPageClient() {
  return (
    <FeatureGate feature="webhooks">
      <WebhooksPageContent />
    </FeatureGate>
  )
}
