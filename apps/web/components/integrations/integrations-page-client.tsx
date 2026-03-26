'use client'

import { useState, useEffect } from 'react'
import { Plus, CheckCircle2, XCircle, AlertCircle, Trash2, RefreshCw, ExternalLink } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { ConnectIntegrationSheet } from './connect-integration-sheet'
import { ProviderIcon } from '@/components/ui/provider-icons'

const statusConfig = {
  active: { label: 'Conectada', icon: CheckCircle2, className: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  error: { label: 'Erro', icon: XCircle, className: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  revoked: { label: 'Revogada', icon: XCircle, className: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  pending: { label: 'Pendente', icon: AlertCircle, className: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
} as const

const categoryLabels: Record<string, string> = {
  ads: 'Anúncios',
  crm: 'CRM',
  analytics: 'Analytics',
  heatmap: 'Heatmap',
  email: 'Email',
  other: 'Outro',
}

const categoryDescriptions: Record<string, string> = {
  ads: 'Campanhas pagas',
  crm: 'Pipeline de vendas',
  analytics: 'Tráfego e comportamento',
  heatmap: 'Mapas de calor e UX',
  email: 'Email marketing',
}

export function IntegrationsPageClient() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [preselectedProviderId, setPreselectedProviderId] = useState<string | null>(null)
  const [oauthTokens, setOauthTokens] = useState<{ access_token: string; refresh_token: string; token_expires_at: string } | null>(null)
  const searchParams = useSearchParams()
  const utils = trpc.useUtils()

  // Detect OAuth return from Google
  useEffect(() => {
    const oauthProvider = searchParams.get('oauth')
    const success = searchParams.get('success')
    if (oauthProvider && success === 'true') {
      // Fetch tokens from cookie via API
      fetch('/api/auth/google/tokens')
        .then((r) => r.json())
        .then((data) => {
          if (data.tokens) {
            setOauthTokens(data.tokens)
            // Find provider by slug and open sheet
            // Will be handled after providers load
          }
        })
        .catch(() => {})
      // Clean URL
      window.history.replaceState({}, '', '/integrations')
    }
  }, [searchParams])

  const { data: integrations = [], isLoading } = trpc.integrations.list.useQuery()
  const { data: providers = [] } = trpc.integrations.listProviders.useQuery()

  // Auto-open sheet when returning from OAuth with tokens
  useEffect(() => {
    if (oauthTokens && providers.length > 0 && !sheetOpen) {
      const provider = providers.find((p) => p.slug === oauthTokens.provider)
      if (provider) {
        setPreselectedProviderId(provider.id)
        setSheetOpen(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oauthTokens, providers.length])

  const testConnection = trpc.integrations.testConnection.useMutation({
    onSuccess: () => utils.integrations.list.invalidate(),
  })
  const disconnect = trpc.integrations.disconnect.useMutation({
    onSuccess: () => utils.integrations.list.invalidate(),
  })

  // Which providers are already connected
  const connectedSlugs = new Set(
    integrations.map((i) => {
      const p = providers.find((p) => p.id === i.providerId)
      return p?.slug
    }).filter(Boolean)
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
            <p className="text-muted-foreground text-sm">
              Conecte suas ferramentas para coleta automática de métricas
            </p>
          </div>
          <button
            onClick={() => {
              setPreselectedProviderId(null)
              setSheetOpen(true)
            }}
            className="
              inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
              bg-primary text-primary-foreground text-sm font-medium
              hover:bg-primary/90 transition-all duration-200
              hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02]
              active:scale-[0.98]
            "
          >
            <Plus className="w-4 h-4" />
            Conectar ferramenta
          </button>
        </div>

        {/* Connected integrations */}
        {integrations.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Conectadas ({integrations.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations.map((integration) => {
                const status = statusConfig[integration.status as keyof typeof statusConfig] ?? statusConfig.pending
                const StatusIcon = status.icon
                const provider = providers.find((p) => p.id === integration.providerId)

                return (
                  <div
                    key={integration.id}
                    className="group rounded-xl border bg-card p-5 space-y-4 transition-all duration-200 hover:shadow-md hover:border-primary/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                          <ProviderIcon slug={provider?.slug ?? ''} className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{integration.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {provider?.name ?? integration.provider.name}
                          </p>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${status.bg} ${status.className}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </div>
                    </div>

                    {integration.errorMessage && (
                      <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2.5 border border-red-100">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted transition-all disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${testConnection.isPending ? 'animate-spin' : ''}`} />
                        Testar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja desconectar esta integração?')) {
                            disconnect.mutate({ id: integration.id })
                          }
                        }}
                        disabled={disconnect.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remover
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Available providers */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {integrations.length > 0 ? 'Ferramentas disponíveis' : 'Conecte suas ferramentas de marketing'}
          </h2>
          {integrations.length === 0 && (
            <p className="text-sm text-muted-foreground max-w-lg">
              Integrações conectam o Funnlio às suas ferramentas. Sem exportar planilhas — as métricas são coletadas automaticamente.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => {
              const isConnected = connectedSlugs.has(provider.slug)

              return (
                <button
                  key={provider.id}
                  onClick={() => {
                    if (!isConnected) {
                      setPreselectedProviderId(provider.id)
                      setSheetOpen(true)
                    }
                  }}
                  disabled={false}
                  className={`
                    group relative rounded-xl border p-5 text-left transition-all duration-200
                    ${isConnected
                      ? 'cursor-default border-green-200 bg-green-50/30 dark:bg-green-950/10'
                      : 'hover:shadow-lg hover:border-primary/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer bg-card'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200
                      ${isConnected ? 'bg-muted' : 'bg-muted/50 group-hover:bg-primary/5 group-hover:shadow-sm'}
                    `}>
                      <ProviderIcon slug={provider.slug} className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{provider.name}</h3>
                        {isConnected && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Conectada
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {categoryDescriptions[provider.category] ?? categoryLabels[provider.category]}
                      </p>
                    </div>
                  </div>

                  {!isConnected && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <ExternalLink className="w-3 h-3" />
                      Conectar
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {sheetOpen && (
        <ConnectIntegrationSheet
          onClose={() => { setSheetOpen(false); setPreselectedProviderId(null); setOauthTokens(null) }}
          initialProviderId={preselectedProviderId}
          oauthTokens={oauthTokens}
        />
      )}
    </>
  )
}
