'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, Shield, CheckCircle2, ExternalLink } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useRouter, useSearchParams } from 'next/navigation'
import { HelpDrawer } from '@/components/ui/help-drawer'
import { getFieldGuide } from '@/lib/provider-guides'
import { ProviderIcon } from '@/components/ui/provider-icons'

interface Props {
  onClose: () => void
  initialProviderId?: string | null
  oauthTokens?: { access_token: string; refresh_token: string; token_expires_at: string } | null
}

const categoryLabels: Record<string, string> = {
  ads: 'Anuncios',
  crm: 'CRM',
  analytics: 'Analytics',
  heatmap: 'Heatmap',
  email: 'Email',
  messaging: 'Mensagens',
  other: 'Outro',
}

const categoryDescriptions: Record<string, string> = {
  ads: 'Metricas de campanhas pagas (impressoes, cliques, custo, leads)',
  crm: 'Dados de pipeline de vendas (leads, negocios, receita)',
  analytics: 'Dados de trafego e comportamento do site',
  heatmap: 'Mapas de calor, scroll depth e comportamento visual',
  email: 'Metricas de email marketing (aberturas, cliques)',
  messaging: 'Notificacoes e alertas para seu time',
}

export function ConnectIntegrationSheet({ onClose, initialProviderId, oauthTokens }: Props) {
  const router = useRouter()
  const utils = trpc.useUtils()
  const [step, setStep] = useState<'select' | 'configure'>('select')
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [oauthAuthenticated, setOauthAuthenticated] = useState(false)

  const { data: providers = [] } = trpc.integrations.listProviders.useQuery()

  const connect = trpc.integrations.connect.useMutation({
    onSuccess: () => {
      // Clear OAuth cookie after successful connection
      fetch('/api/auth/google/tokens', { method: 'DELETE' }).catch(() => {})
      utils.integrations.list.invalidate()
      router.refresh()
      onClose()
    },
    onError: (err) => setError(err.message),
  })

  // Auto-select provider when opened from a specific card
  useEffect(() => {
    if (initialProviderId && providers.length > 0 && step === 'select') {
      handleSelectProvider(initialProviderId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProviderId, providers.length])

  // Pre-fill OAuth tokens if returning from Google OAuth
  useEffect(() => {
    if (oauthTokens && selectedProviderId) {
      setCredentials((prev) => ({
        ...prev,
        access_token: oauthTokens.access_token,
        refresh_token: oauthTokens.refresh_token,
        token_expires_at: oauthTokens.token_expires_at,
      }))
      setOauthAuthenticated(true)
    }
  }, [oauthTokens, selectedProviderId])

  const selectedProvider = providers.find((p) => p.id === selectedProviderId)
  const configSchema = selectedProvider?.configSchema as {
    authType?: string
    fields?: Array<{ key: string; label: string; type: string; required: boolean; helpText?: string; placeholder?: string }>
  } | undefined
  const isOAuth = configSchema?.authType === 'oauth2'
  const configFields = configSchema?.fields ?? []

  // For OAuth providers, check if Google env vars are configured
  const googleOAuthAvailable = true // This is checked server-side; if redirect fails, user sees error

  function handleSelectProvider(providerId: string) {
    const provider = providers.find((p) => p.id === providerId)
    setSelectedProviderId(providerId)
    setName(provider?.name ?? '')
    setCredentials({})
    setError(null)
    setOauthAuthenticated(false)
    setStep('configure')
  }

  function handleCredentialChange(key: string, value: string) {
    setCredentials((prev) => ({ ...prev, [key]: value }))
  }

  function handleGoogleOAuth() {
    if (!selectedProvider) return
    // Redirect to our Google OAuth route
    window.location.href = `/api/auth/google?provider=${selectedProvider.slug}`
  }

  function handleSubmit() {
    if (!selectedProviderId || !name.trim()) return
    setError(null)
    connect.mutate({
      providerId: selectedProviderId,
      name: name.trim(),
      credentials,
    })
  }

  const requiredFieldsFilled = configFields
    .filter((f) => f.required)
    .every((f) => credentials[f.key]?.trim())
  // For OAuth providers, also require OAuth authentication
  const oauthReady = !isOAuth || oauthAuthenticated
  const canSubmit = name.trim() && requiredFieldsFilled && oauthReady && !connect.isPending

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background border-l shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            {step === 'configure' && (
              <button
                onClick={() => setStep('select')}
                className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {step === 'select' ? 'Conectar ferramenta' : `Configurar ${selectedProvider?.name}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {step === 'select' ? (
            <>
              <p className="text-sm text-muted-foreground">
                Conecte uma ferramenta para o Funnlio coletar metricas automaticamente.
              </p>
              <div className="space-y-2">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleSelectProvider(provider.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left hover:bg-muted hover:border-primary/20 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                      <ProviderIcon slug={provider.slug} className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{provider.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {categoryDescriptions[provider.category] ?? categoryLabels[provider.category] ?? provider.category}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Context */}
              <div className="rounded-md bg-muted/50 border p-3 space-y-1">
                <p className="text-xs text-foreground font-medium">
                  {isOAuth
                    ? `Autentique com o Google para conectar o ${selectedProvider?.name}.`
                    : `Preencha as credenciais abaixo para conectar o ${selectedProvider?.name}.`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isOAuth
                    ? 'Clique no botao abaixo para autorizar o acesso. Depois preencha os campos adicionais.'
                    : 'Nao sabe onde encontrar? Clique em "Como obter?" abaixo de cada campo.'}
                </p>
              </div>

              {/* OAuth button for Google providers */}
              {isOAuth && (
                <div className="space-y-2">
                  {oauthAuthenticated ? (
                    <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 p-3">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <p className="text-xs text-green-800 font-medium">
                        Conta Google autenticada com sucesso. Preencha os campos abaixo.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleGoogleOAuth}
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all"
                    >
                      {/* Google icon */}
                      <svg width="18" height="18" viewBox="0 0 18 18">
                        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                      </svg>
                      <span className="text-sm font-medium text-primary">Autenticar com Google</span>
                      <ExternalLink className="w-3.5 h-3.5 text-primary/60" />
                    </button>
                  )}
                </div>
              )}

              {/* Connection name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome da conexao *</label>
                <p className="text-xs text-muted-foreground">
                  Um nome para identificar esta conexao (ex: "{selectedProvider?.name} - Conta Principal")
                </p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`Ex: ${selectedProvider?.name} - Conta Principal`}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Dynamic fields (for OAuth: only show after authentication) */}
              {(!isOAuth || oauthAuthenticated) && configFields.map((field) => {
                const guide = selectedProvider
                  ? getFieldGuide(selectedProvider.slug, field.key)
                  : null

                return (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-sm font-medium">
                      {field.label}
                      {field.required && ' *'}
                    </label>
                    {field.helpText && (
                      <p className="text-xs text-muted-foreground">{field.helpText}</p>
                    )}
                    <input
                      type={field.type === 'password' ? 'password' : 'text'}
                      value={credentials[field.key] ?? ''}
                      onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                      placeholder={field.placeholder ?? ''}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {guide && (
                      <HelpDrawer
                        steps={guide.steps}
                        link={guide.link}
                        note={guide.note}
                      />
                    )}
                  </div>
                )
              })}

              {/* Security note */}
              <div className="flex items-start gap-2 rounded-md bg-green-50 border border-green-200 p-3">
                <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-green-800">
                  Suas credenciais sao criptografadas com AES-256 antes de serem salvas. Nunca sao exibidas apos a conexao.
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {step === 'configure' && (
          <div className="px-6 py-4 border-t flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 py-2 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {connect.isPending ? 'Validando e conectando...' : 'Conectar'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
