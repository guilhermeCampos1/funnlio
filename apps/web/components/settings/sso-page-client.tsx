'use client'

import { useState } from 'react'
import { Shield, ExternalLink, Upload, CheckCircle2, AlertCircle, Lock } from 'lucide-react'
import { trpc } from '@/lib/trpc'

export function SSOPageClient() {
  const [xmlMetadata, setXmlMetadata] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { data: billing } = trpc.billing.getSubscription.useQuery()
  const billingStatus = trpc.billing.getPlanLimits.useQuery()
  const hasSSOAccess = (billingStatus.data as { hasSso?: boolean } | undefined)?.hasSso ?? false

  if (!hasSSOAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Single Sign-On (SSO)</h1>
          <p className="text-muted-foreground">Autenticação corporativa via SAML 2.0</p>
        </div>
        <div className="rounded-xl border bg-card p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">SSO disponível no plano Enterprise</p>
            <p className="text-sm text-muted-foreground mt-1">
              Integre com Okta, Azure AD, Google Workspace e outros provedores SAML.
            </p>
          </div>
          <a
            href="/settings/billing"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            Fazer upgrade para Enterprise
          </a>
        </div>
      </div>
    )
  }

  const handleAdd = async () => {
    if (!xmlMetadata.trim()) {
      setError('Cole o XML de metadados do seu IdP')
      return
    }

    setIsAdding(true)
    setError(null)

    try {
      const resp = await fetch('/api/sso/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawMetadata: xmlMetadata }),
      })

      if (!resp.ok) {
        const err = (await resp.json()) as { message?: string }
        throw new Error(err.message ?? 'Falha ao adicionar conexão SSO')
      }

      setSuccess(true)
      setXmlMetadata('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Single Sign-On (SSO)</h1>
        <p className="text-muted-foreground">Configure autenticação SAML 2.0 para sua organização</p>
      </div>

      {/* SP Metadata */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-blue-500/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="font-medium text-sm">Metadados do Service Provider</p>
            <p className="text-xs text-muted-foreground">Forneça este URL ao seu IdP para configurar a integração</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-muted rounded px-3 py-2 font-mono break-all">
            {typeof window !== 'undefined' ? window.location.origin : ''}/api/sso/metadata
          </code>
          <button
            type="button"
            onClick={() => window.open('/api/sso/metadata', '_blank')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm hover:bg-muted"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir
          </button>
        </div>
      </div>

      {/* Add Connection */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div>
          <p className="font-medium text-sm">Adicionar Conexão SSO</p>
          <p className="text-xs text-muted-foreground">Cole o XML de metadados do seu IdP (Okta, Azure AD, Google Workspace, etc.)</p>
        </div>

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Conexão SSO adicionada com sucesso!
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <textarea
          placeholder={`<?xml version="1.0" encoding="UTF-8"?>\n<EntityDescriptor...>`}
          value={xmlMetadata}
          onChange={(e) => setXmlMetadata(e.target.value)}
          rows={8}
          className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-xs resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <button
          type="button"
          onClick={() => { void handleAdd() }}
          disabled={isAdding || !xmlMetadata.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {isAdding ? 'Adicionando...' : 'Adicionar Conexão'}
        </button>
      </div>

      {/* Supported IdPs */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <p className="font-medium text-sm">Provedores Suportados</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['Okta', 'Azure AD', 'Google Workspace', 'OneLogin', 'Ping Identity', 'Auth0', 'JumpCloud', 'ADFS'].map(idp => (
            <div key={idp} className="rounded-lg border px-3 py-2 text-xs text-center text-muted-foreground">
              {idp}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
