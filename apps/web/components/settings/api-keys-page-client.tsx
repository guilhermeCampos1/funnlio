'use client'

import { useState } from 'react'
import { Key, Plus, Copy, Check, Trash2, ShieldAlert } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import { FeatureGate } from '@/components/billing/feature-gate'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  prefix: string
  lastUsedAt: string | null
  isActive: boolean
  active: boolean
  createdAt: string
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ApiKeysSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      <div className="h-4 w-72 bg-muted animate-pulse rounded" />
      <div className="h-14 bg-muted animate-pulse rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Copy button
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
// Created key banner (shown once)
// ---------------------------------------------------------------------------

function CreatedKeyBanner({ rawKey, onDismiss }: { rawKey: string; onDismiss: () => void }) {
  const [hasCopied, setHasCopied] = useState(false)
  const [showGreenCheck, setShowGreenCheck] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(rawKey)
    setHasCopied(true)
    setShowGreenCheck(true)
    setTimeout(() => setShowGreenCheck(false), 3000)
  }

  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800 p-4 space-y-2">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Copie a chave antes de fechar — ela nao sera exibida novamente
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-md bg-background border px-3 py-2">
            <code className="text-xs font-mono flex-1 break-all select-all">{rawKey}</code>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Copiar"
            >
              {showGreenCheck ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          disabled={!hasCopied}
          className={cn(
            'p-1 transition-colors',
            hasCopied
              ? 'text-muted-foreground hover:text-foreground cursor-pointer'
              : 'text-muted-foreground/30 cursor-not-allowed',
          )}
          aria-label="Fechar"
        >
          &times;
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <Key className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm font-medium">Nenhuma API key criada</p>
      <p className="text-xs text-muted-foreground mt-1">
        Crie uma chave para acessar a API do Funnlio programaticamente.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function ApiKeysPageContent() {
  const [name, setName] = useState('')
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const { data: keys = [], isLoading } = trpc.apiKeys.list.useQuery()

  const createKey = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => {
      setCreatedRawKey(data.rawKey)
      setName('')
      utils.apiKeys.list.invalidate()
    },
  })

  const revokeKey = trpc.apiKeys.revoke.useMutation({
    onSuccess: () => utils.apiKeys.list.invalidate(),
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createKey.mutate({ name: name.trim() })
  }

  if (isLoading) {
    return <ApiKeysSkeleton />
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
          <Key className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground mt-1">
          Gerencie chaves de acesso para a API do Funnlio.
        </p>
      </div>

      {/* Created key banner */}
      {createdRawKey && (
        <CreatedKeyBanner rawKey={createdRawKey} onDismiss={() => setCreatedRawKey(null)} />
      )}

      {/* Create form */}
      <form onSubmit={handleCreate} className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="font-medium text-sm">Criar nova chave</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da chave (ex: Meu App)"
            className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={createKey.isPending || !name.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {createKey.isPending ? 'Criando...' : 'Criar'}
          </button>
        </div>
        {createKey.error && (
          <p className="text-sm text-destructive">{createKey.error.message}</p>
        )}
      </form>

      {/* Keys list */}
      {keys.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          {(keys as unknown as ApiKey[]).map((key) => (
            <div key={key.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Key className={cn('w-4 h-4', key.isActive ? 'text-primary' : 'text-muted-foreground')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{key.name}</p>
                  <span
                    className={cn(
                      'text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full',
                      key.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
                    )}
                  >
                    {key.isActive ? 'Ativa' : 'Revogada'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <code className="text-xs text-muted-foreground font-mono">{key.keyPrefix}...</code>
                  <span className="text-xs text-muted-foreground">
                    {key.lastUsedAt
                      ? `Ultimo uso: ${new Date(key.lastUsedAt).toLocaleDateString('pt-BR')}`
                      : 'Nunca usada'}
                  </span>
                </div>
              </div>
              {key.isActive && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Revogar a chave "${key.name}"? Essa acao nao pode ser desfeita.`)) {
                      revokeKey.mutate({ id: key.id })
                    }
                  }}
                  disabled={revokeKey.isPending}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground flex items-start gap-3">
        <Key className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          Chaves de API permitem acesso programatico aos seus funis e metricas.
          Cada chave herda as permissoes da organizacao. Revogue chaves que nao estejam mais em uso.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function ApiKeysPageClient() {
  return (
    <FeatureGate feature="api">
      <ApiKeysPageContent />
    </FeatureGate>
  )
}
