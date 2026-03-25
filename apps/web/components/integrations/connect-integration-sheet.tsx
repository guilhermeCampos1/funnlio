'use client'

import { useState } from 'react'
import { X, ChevronLeft, Shield } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useRouter } from 'next/navigation'
import { HelpDrawer } from '@/components/ui/help-drawer'
import { getFieldGuide } from '@/lib/provider-guides'
import { ProviderIcon } from '@/components/ui/provider-icons'

interface Props {
  onClose: () => void
}

const categoryLabels: Record<string, string> = {
  ads: 'Anúncios',
  crm: 'CRM',
  analytics: 'Analytics',
  heatmap: 'Heatmap',
  email: 'Email',
  other: 'Outro',
}

const categoryDescriptions: Record<string, string> = {
  ads: 'Métricas de campanhas pagas (impressões, cliques, custo, leads)',
  crm: 'Dados de pipeline de vendas (leads, negócios, receita)',
  analytics: 'Dados de tráfego e comportamento do site',
  heatmap: 'Mapas de calor, scroll depth e comportamento visual',
  email: 'Métricas de email marketing (aberturas, cliques)',
}

export function ConnectIntegrationSheet({ onClose }: Props) {
  const router = useRouter()
  const utils = trpc.useUtils()
  const [step, setStep] = useState<'select' | 'configure'>('select')
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const { data: providers = [] } = trpc.integrations.listProviders.useQuery()

  const connect = trpc.integrations.connect.useMutation({
    onSuccess: () => {
      utils.integrations.list.invalidate()
      router.refresh()
      onClose()
    },
    onError: (err) => setError(err.message),
  })

  const selectedProvider = providers.find((p) => p.id === selectedProviderId)
  const configFields = (selectedProvider?.configSchema as { fields?: Array<{ key: string; label: string; type: string; required: boolean; helpText?: string; placeholder?: string }> })?.fields ?? []

  function handleSelectProvider(providerId: string) {
    const provider = providers.find((p) => p.id === providerId)
    setSelectedProviderId(providerId)
    setName(provider?.name ?? '')
    setCredentials({})
    setError(null)
    setStep('configure')
  }

  function handleCredentialChange(key: string, value: string) {
    setCredentials((prev) => ({ ...prev, [key]: value }))
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
  const canSubmit = name.trim() && requiredFieldsFilled && !connect.isPending

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
                Conecte uma ferramenta para o Funnlio coletar métricas automaticamente.
                Você precisará de credenciais de acesso — cada ferramenta tem um guia passo-a-passo na próxima tela.
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
              {/* Microcopy de contexto */}
              <div className="rounded-md bg-muted/50 border p-3 space-y-1">
                <p className="text-xs text-foreground font-medium">
                  Preencha as credenciais abaixo para conectar o {selectedProvider?.name}.
                </p>
                <p className="text-xs text-muted-foreground">
                  Não sabe onde encontrar? Clique em "Como obter?" abaixo de cada campo.
                </p>
              </div>

              {/* Nome da conexão */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome da conexão *</label>
                <p className="text-xs text-muted-foreground">
                  Um nome para identificar esta conexão (ex: "Meta Ads - Conta Principal")
                </p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Meta Ads - Conta Principal"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Campos dinâmicos do provider com guias */}
              {configFields.map((field) => {
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
                  Suas credenciais são criptografadas com AES-256 antes de serem salvas. Nunca são exibidas após a conexão.
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
