'use client'

import { ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface FunnelHeaderProps {
  funnel: {
    id: string
    name: string
    description: string | null
    status: string
    color: string | null
  }
}

export function FunnelHeader({ funnel }: FunnelHeaderProps) {
  return (
    <div className="space-y-2">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar ao dashboard
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {funnel.color && (
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: funnel.color }}
            />
          )}
          <h1 className="text-2xl font-bold">{funnel.name}</h1>
        </div>

        <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border hover:bg-muted transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Sincronizar tudo
        </button>
      </div>

      {funnel.description && (
        <p className="text-muted-foreground">{funnel.description}</p>
      )}
    </div>
  )
}
