'use client'

import { useState } from 'react'
import { Plug, Plus, CheckCircle2, XCircle, AlertCircle, Trash2, RefreshCw } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { ConnectIntegrationSheet } from './connect-integration-sheet'

const statusConfig = {
  active: { label: 'Ativa', icon: CheckCircle2, className: 'text-green-600' },
  error: { label: 'Erro', icon: XCircle, className: 'text-red-600' },
  revoked: { label: 'Revogada', icon: XCircle, className: 'text-red-600' },
  pending: { label: 'Pendente', icon: AlertCircle, className: 'text-yellow-600' },
} as const

const categoryLabels: Record<string, string> = {
  ads: 'Anúncios',
  crm: 'CRM',
  analytics: 'Analytics',
  heatmap: 'Heatmap',
  email: 'Email',
  other: 'Outro',
}

export function IntegrationsPageClient() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const utils = trpc.useUtils()

  const { data: integrations = [], isLoading } = trpc.integrations.list.useQuery()
  const { data: providers = [] } = trpc.integrations.listProviders.useQuery()

  const testConnection = trpc.integrations.testConnection.useMutation({
    onSuccess: () => utils.integrations.list.invalidate(),
  })
  const disconnect = trpc.integrations.disconnect.useMutation({
    onSuccess: () => utils.integrations.list.invalidate(),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
            <p className="text-muted-foreground">
              {integrations.length} integraç{integrations.length !== 1 ? 'ões' : 'ão'} conectada{integrations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Conectar ferramenta
          </button>
        </div>

        {integrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <Plug className="w-10 h-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma integração conectada</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm">
              Conecte suas ferramentas de marketing para começar a coletar métricas automaticamente.
            </p>
            <button
              onClick={() => setSheetOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Conectar primeira ferramenta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integration) => {
              const status = statusConfig[integration.status as keyof typeof statusConfig] ?? statusConfig.pending
              const StatusIcon = status.icon
              const provider = providers.find((p) => p.id === integration.providerId)

              return (
                <div key={integration.id} className="rounded-lg border bg-card p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{integration.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {provider?.name ?? integration.provider.name}
                        {provider && (
                          <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                            {categoryLabels[provider.category] ?? provider.category}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${status.className}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </div>
                  </div>

                  {integration.errorMessage && (
                    <p className="text-xs text-red-600 bg-red-50 rounded p-2">
                      {integration.errorMessage}
                    </p>
                  )}

                  {integration.lastSyncedAt && (
                    <p className="text-xs text-muted-foreground">
                      Último sync:{' '}
                      {new Intl.DateTimeFormat('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(integration.lastSyncedAt))}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => testConnection.mutate({ id: integration.id })}
                      disabled={testConnection.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${testConnection.isPending ? 'animate-spin' : ''}`} />
                      Testar conexão
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja desconectar esta integração?')) {
                          disconnect.mutate({ id: integration.id })
                        }
                      }}
                      disabled={disconnect.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      Desconectar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {sheetOpen && (
        <ConnectIntegrationSheet onClose={() => setSheetOpen(false)} />
      )}
    </>
  )
}
