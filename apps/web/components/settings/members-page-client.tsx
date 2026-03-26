'use client'

import { useState } from 'react'
import { Users, Plus, Trash2, Crown, Shield, Eye } from 'lucide-react'
import { trpc } from '@/lib/trpc'

const roleConfig = {
  owner: { label: 'Dono', icon: Crown, className: 'text-yellow-600' },
  admin: { label: 'Admin', icon: Shield, className: 'text-blue-600' },
  viewer: { label: 'Visualizador', icon: Eye, className: 'text-muted-foreground' },
} as const

export function MembersPageClient() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const { data: members = [], isLoading } = trpc.organizations.listMembers.useQuery()

  const invite = trpc.organizations.inviteMember.useMutation({
    onSuccess: () => {
      utils.organizations.listMembers.invalidate()
      setEmail('')
      setError(null)
      setSuccess('Membro adicionado com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
    },
    onError: (err) => {
      setError(err.message)
      setSuccess(null)
    },
  })

  const remove = trpc.organizations.removeMember.useMutation({
    onSuccess: () => utils.organizations.listMembers.invalidate(),
  })

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setError(null)
    invite.mutate({ email: email.trim(), role })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Membros</h1>
        <p className="text-muted-foreground">
          Gerencie quem tem acesso à sua organização.
        </p>
      </div>

      {/* Invite form */}
      <form onSubmit={handleInvite} className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="font-medium text-sm">Adicionar membro</h2>
        <p className="text-xs text-muted-foreground">
          O convidado precisa já ter uma conta no Funnlio e terá acesso a todos os funis desta organização.
        </p>

        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'viewer')}
            className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="viewer">Visualizador (apenas leitura)</option>
            <option value="admin">Admin (cria funis e integrações)</option>
          </select>
          <button
            type="submit"
            disabled={invite.isPending || !email.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {invite.isPending ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
      </form>

      {/* Members list */}
      <div className="rounded-lg border bg-card divide-y">
        {members.map((member) => {
          const roleInfo = roleConfig[member.role as keyof typeof roleConfig] ?? roleConfig.viewer
          const RoleIcon = roleInfo.icon

          return (
            <div key={member.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium flex-shrink-0">
                {(member.name ?? member.email)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{member.name ?? 'Sem nome'}</p>
                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-medium ${roleInfo.className}`}>
                <RoleIcon className="w-3.5 h-3.5" />
                {roleInfo.label}
              </div>
              {member.role !== 'owner' && (
                <button
                  onClick={() => {
                    if (confirm(`Remover ${member.name ?? member.email} da organização?`)) {
                      remove.mutate({ memberId: member.id })
                    }
                  }}
                  disabled={remove.isPending}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
