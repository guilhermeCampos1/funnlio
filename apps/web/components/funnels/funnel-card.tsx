import Link from 'next/link'
import { ArrowRight, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

function getSyncHealth(lastSyncedAt: Date | string | null, status: string) {
  if (status === 'paused' || status === 'archived') return null
  if (!lastSyncedAt) return 'red'
  const diffHours = (Date.now() - new Date(lastSyncedAt).getTime()) / (1000 * 60 * 60)
  if (diffHours < 4) return 'green'
  if (diffHours < 48) return 'yellow'
  return 'red'
}

const healthConfig = {
  green: { label: 'Dados frescos', dot: 'bg-green-500', text: 'text-green-600' },
  yellow: { label: 'Sync pendente', dot: 'bg-yellow-400', text: 'text-yellow-600' },
  red: { label: 'Atenção', dot: 'bg-red-500', text: 'text-red-600' },
}

interface FunnelCardProps {
  funnel: {
    id: string
    name: string
    description: string | null
    status: 'active' | 'paused' | 'archived'
    color: string | null
    stageCount: number
    lastSyncedAt: Date | string | null
    createdAt: Date | string
  }
}

const statusConfig = {
  active: { label: 'Ativo', class: 'text-green-600' },
  paused: { label: 'Pausado', class: 'text-yellow-600' },
  archived: { label: 'Arquivado', class: 'text-muted-foreground' },
}

export function FunnelCard({ funnel }: FunnelCardProps) {
  const status = statusConfig[funnel.status]
  const health = getSyncHealth(funnel.lastSyncedAt, funnel.status)
  const healthStyle = health ? healthConfig[health] : null

  return (
    <Link href={`/funnels/${funnel.id}`} className="block group">
      <div className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {funnel.color && (
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                style={{ backgroundColor: funnel.color }}
              />
            )}
            <div>
              <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                {funnel.name}
              </h3>
              {funnel.description && (
                <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">
                  {funnel.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {healthStyle && (
              <span className={cn('flex items-center gap-1 text-xs font-medium', healthStyle.text)}>
                <span className={cn('w-2 h-2 rounded-full', healthStyle.dot)} />
                {healthStyle.label}
              </span>
            )}
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Etapas</span>
            <span className="ml-1.5 font-medium">{funnel.stageCount}</span>
          </div>
          <div className={cn('flex items-center gap-1.5', status.class)}>
            <Circle className="w-2 h-2 fill-current" />
            <span className="text-xs">{status.label}</span>
          </div>
        </div>

        {/* Last sync */}
        {funnel.lastSyncedAt && (
          <p className="text-xs text-muted-foreground">
            Último sync:{' '}
            {new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' }).format(
              Math.round((new Date(funnel.lastSyncedAt).getTime() - Date.now()) / 60000),
              'minutes'
            )}
          </p>
        )}
      </div>
    </Link>
  )
}
