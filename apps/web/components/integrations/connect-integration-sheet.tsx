'use client'

import { useState } from 'react'
import { X, Check, ChevronLeft } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useRouter } from 'next/navigation'

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
                Selecione a ferramenta que deseja conectar ao Funnlio.
              </p>
              <div className="space-y-2">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleSelectProvider(provider.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{provider.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {categoryLabels[provider.category] ?? provider.category}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Nome da conexão */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome da conexão *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Meta Ads - Conta Principal"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Campos dinâmicos do provider */}
              {configFields.map((field) => (
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
                </div>
              ))}

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
              {connect.isPending ? 'Conectando...' : 'Conectar'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
