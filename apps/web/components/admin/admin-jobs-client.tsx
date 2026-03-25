'use client'

import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import { RefreshCw, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

const statusConfig = {
  queued: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Na fila' },
  running: { icon: Loader2, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Executando' },
  success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Sucesso' },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Falhou' },
  cancelled: { icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Cancelado' },
}

export function AdminJobsClient() {
  const { data: jobs, isLoading, refetch } = trpc.admin.listJobs.useQuery()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs de Sincronização</h1>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
        </div>
      ) : jobs && jobs.length > 0 ? (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Trigger</th>
                <th className="text-left p-3 font-medium">Organização</th>
                <th className="text-left p-3 font-medium">Início</th>
                <th className="text-left p-3 font-medium">Fim</th>
                <th className="text-left p-3 font-medium">Erro</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job: { id: string; status: string; trigger: string; organizationId: string; startedAt: string | Date | null; finishedAt: string | Date | null; error: string | null }) => {
                const config = statusConfig[job.status as keyof typeof statusConfig] ?? statusConfig.queued
                const Icon = config.icon
                return (
                  <tr key={job.id} className="border-t hover:bg-muted/30">
                    <td className="p-3">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', config.bg, config.color)}>
                        <Icon className={cn('w-3 h-3', job.status === 'running' && 'animate-spin')} />
                        {config.label}
                      </span>
                    </td>
                    <td className="p-3 capitalize">{job.trigger}</td>
                    <td className="p-3 text-xs">{job.organizationId.slice(0, 8)}...</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {job.startedAt ? new Date(job.startedAt).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {job.finishedAt ? new Date(job.finishedAt).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="p-3 text-xs text-red-600 max-w-xs truncate">{job.error ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground">Nenhum job recente.</p>
      )}
    </div>
  )
}
