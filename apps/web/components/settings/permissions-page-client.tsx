'use client'

import { useState } from 'react'
import { Shield, Crown, Eye, Pencil, ChevronDown } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PermissionLevel = 'owner' | 'admin' | 'editor' | 'viewer'

interface OrgMember {
  id: string
  name: string | null
  email: string
  role: string
}

// ---------------------------------------------------------------------------
// Role config
// ---------------------------------------------------------------------------

const roleConfig: Record<PermissionLevel, {
  label: string
  icon: typeof Crown
  className: string
  description: string
}> = {
  owner: {
    label: 'Dono',
    icon: Crown,
    className: 'text-yellow-600',
    description: 'Acesso total. Pode transferir propriedade e excluir a organizacao.',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    className: 'text-blue-600',
    description: 'Gerencia membros, integracoes e configuracoes. Nao pode excluir a org.',
  },
  editor: {
    label: 'Editor',
    icon: Pencil,
    className: 'text-green-600',
    description: 'Cria e edita funis, conecta integracoes. Nao gerencia membros.',
  },
  viewer: {
    label: 'Visualizador',
    icon: Eye,
    className: 'text-muted-foreground',
    description: 'Acesso somente leitura a funis e dashboards.',
  },
}

const editableRoles: PermissionLevel[] = ['admin', 'editor', 'viewer']

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function PermissionsSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      <div className="h-4 w-72 bg-muted animate-pulse rounded" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Role selector dropdown
// ---------------------------------------------------------------------------

function RoleSelector({
  currentRole,
  memberId,
  onChangeRole,
  isPending,
}: {
  currentRole: PermissionLevel
  memberId: string
  onChangeRole: (memberId: string, newRole: PermissionLevel) => void
  isPending: boolean
}) {
  const [open, setOpen] = useState(false)
  const config = roleConfig[currentRole]
  const RoleIcon = config.icon

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className={cn(
          'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors',
          config.className,
          isPending && 'opacity-50 cursor-not-allowed',
          !isPending && 'hover:bg-muted',
        )}
      >
        <RoleIcon className="w-3.5 h-3.5" />
        {config.label}
        <ChevronDown className="w-3 h-3 ml-0.5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-64 rounded-lg border bg-card shadow-lg z-20 py-1">
            {editableRoles.map((role) => {
              const rc = roleConfig[role]
              const Icon = rc.icon
              const isSelected = currentRole === role
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    if (!isSelected) {
                      onChangeRole(memberId, role)
                    }
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2.5 hover:bg-muted transition-colors flex items-start gap-3',
                    isSelected && 'bg-muted/50',
                  )}
                >
                  <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', rc.className)} />
                  <div>
                    <p className={cn('text-sm font-medium', rc.className)}>{rc.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rc.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

export function PermissionsPageClient() {
  const utils = trpc.useUtils()
  const { data: members = [], isLoading } = trpc.organizations.listMembers.useQuery()
  const [pendingMember, setPendingMember] = useState<string | null>(null)

  const updateRole = trpc.organizations.updateMemberRole.useMutation({
    onMutate: ({ memberId }) => {
      setPendingMember(memberId)
    },
    onSettled: () => {
      setPendingMember(null)
      utils.organizations.listMembers.invalidate()
    },
  })

  function handleChangeRole(memberId: string, newRole: PermissionLevel) {
    updateRole.mutate({ memberId, role: newRole })
  }

  if (isLoading) {
    return <PermissionsSkeleton />
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Permissoes</h1>
          <Shield className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground mt-1">
          Gerencie os niveis de permissao dos membros da organizacao.
        </p>
      </div>

      {/* Role descriptions */}
      <div className="grid grid-cols-2 gap-3">
        {(Object.entries(roleConfig) as Array<[PermissionLevel, typeof roleConfig[PermissionLevel]]>).map(([key, config]) => {
          const Icon = config.icon
          return (
            <div
              key={key}
              className="rounded-lg border p-3 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className={cn('w-4 h-4', config.className)} />
              </div>
              <div>
                <p className={cn('text-sm font-medium', config.className)}>{config.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Members list */}
      {(members as OrgMember[]).length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">Nenhum membro encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">
            Adicione membros na pagina de Membros para gerenciar suas permissoes.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          {(members as OrgMember[]).map((member) => {
            const role = (member.role as PermissionLevel) in roleConfig
              ? (member.role as PermissionLevel)
              : 'viewer'
            const config = roleConfig[role]
            const Icon = config.icon
            const isOwner = role === 'owner'

            return (
              <div key={member.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {(member.name ?? member.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name ?? 'Sem nome'}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>

                {isOwner ? (
                  <div className={cn('flex items-center gap-1.5 text-xs font-medium', config.className)}>
                    <Icon className="w-3.5 h-3.5" />
                    {config.label}
                  </div>
                ) : (
                  <RoleSelector
                    currentRole={role}
                    memberId={member.id}
                    onChangeRole={handleChangeRole}
                    isPending={pendingMember === member.id}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Info */}
      {updateRole.error && (
        <p className="text-sm text-destructive">{updateRole.error.message}</p>
      )}
    </div>
  )
}
