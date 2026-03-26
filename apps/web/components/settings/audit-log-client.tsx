'use client'

import { useState, useMemo } from 'react'
import { ScrollText, Filter, Calendar, User, Search } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import { FeatureGate } from '@/components/billing/feature-gate'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditEntry {
  id: string
  action: string
  userId: string
  userName: string | null
  userEmail: string
  resource: string
  resourceId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'funnel.created': { label: 'Funil criado', color: 'text-green-600' },
  'funnel.updated': { label: 'Funil atualizado', color: 'text-blue-600' },
  'funnel.deleted': { label: 'Funil excluido', color: 'text-red-600' },
  'stage.created': { label: 'Etapa criada', color: 'text-green-600' },
  'stage.updated': { label: 'Etapa atualizada', color: 'text-blue-600' },
  'stage.deleted': { label: 'Etapa excluida', color: 'text-red-600' },
  'integration.connected': { label: 'Integracao conectada', color: 'text-green-600' },
  'integration.disconnected': { label: 'Integracao desconectada', color: 'text-orange-600' },
  'member.invited': { label: 'Membro convidado', color: 'text-blue-600' },
  'member.removed': { label: 'Membro removido', color: 'text-red-600' },
  'member.role_changed': { label: 'Permissao alterada', color: 'text-yellow-600' },
  'api_key.created': { label: 'API key criada', color: 'text-green-600' },
  'api_key.revoked': { label: 'API key revogada', color: 'text-red-600' },
  'webhook.created': { label: 'Webhook criado', color: 'text-green-600' },
  'webhook.deleted': { label: 'Webhook excluido', color: 'text-red-600' },
  'billing.plan_changed': { label: 'Plano alterado', color: 'text-purple-600' },
  'export.generated': { label: 'Exportacao gerada', color: 'text-blue-600' },
}

const ACTION_TYPE_OPTIONS = Object.keys(ACTION_LABELS)

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function AuditSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      <div className="h-4 w-72 bg-muted animate-pulse rounded" />
      <div className="h-12 bg-muted animate-pulse rounded-lg" />
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

function FilterBar({
  actionFilter,
  onActionFilterChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  searchQuery,
  onSearchQueryChange,
}: {
  actionFilter: string
  onActionFilterChange: (v: string) => void
  dateFrom: string
  dateTo: string
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
  searchQuery: string
  onSearchQueryChange: (v: string) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 flex-shrink-0">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">Filtros:</span>
      </div>

      {/* Action type */}
      <select
        value={actionFilter}
        onChange={(e) => onActionFilterChange(e.target.value)}
        className="px-3 py-1.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Todas as acoes</option>
        {ACTION_TYPE_OPTIONS.map((action) => (
          <option key={action} value={action}>
            {ACTION_LABELS[action]?.label ?? action}
          </option>
        ))}
      </select>

      {/* Date range */}
      <div className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="px-2 py-1.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="text-xs text-muted-foreground">ate</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="px-2 py-1.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
        <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Buscar por usuario ou recurso..."
          className="w-full px-2 py-1.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <ScrollText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm font-medium">
        {hasFilters ? 'Nenhum evento encontrado' : 'Nenhum evento registrado'}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {hasFilters
          ? 'Tente ajustar os filtros para ver mais resultados.'
          : 'Acoes realizadas na organizacao serao registradas aqui.'}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function AuditLogContent() {
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const queryParams = useMemo(() => ({
    action: actionFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }), [actionFilter, dateFrom, dateTo])

  const { data: entries = [], isLoading } = trpc.auditLog.list.useQuery(queryParams)

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries as AuditEntry[]
    const q = searchQuery.toLowerCase()
    return (entries as AuditEntry[]).filter(
      (entry) =>
        (entry.userName?.toLowerCase().includes(q) ?? false) ||
        entry.userEmail.toLowerCase().includes(q) ||
        entry.resource.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q),
    )
  }, [entries, searchQuery])

  const hasFilters = Boolean(actionFilter || dateFrom || dateTo || searchQuery)

  if (isLoading) {
    return <AuditSkeleton />
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <ScrollText className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground mt-1">
          Historico de todas as acoes realizadas na organizacao.
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        actionFilter={actionFilter}
        onActionFilterChange={setActionFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      {/* Table */}
      {filteredEntries.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Acao</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Usuario</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Recurso</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEntries.map((entry) => {
                  const actionInfo = ACTION_LABELS[entry.action]
                  return (
                    <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className={cn('text-sm font-medium', actionInfo?.color ?? 'text-foreground')}>
                          {actionInfo?.label ?? entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
                            {(entry.userName ?? entry.userEmail)[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm truncate">{entry.userName ?? entry.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {entry.resource}
                          {entry.resourceId ? `:${entry.resourceId.slice(0, 8)}` : ''}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground flex items-start gap-3">
        <ScrollText className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          O audit log registra todas as acoes administrativas da organizacao.
          Disponivel apenas para planos Enterprise. Logs sao retidos por 90 dias.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function AuditLogClient() {
  return (
    <FeatureGate feature="audit_log">
      <AuditLogContent />
    </FeatureGate>
  )
}
