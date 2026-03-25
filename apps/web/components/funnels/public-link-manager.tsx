'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Link2, Copy, Check, Trash2, Plus, ExternalLink, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FeatureGate } from '@/components/billing/feature-gate'

interface PublicLinkManagerProps {
  funnelId: string
}

export function PublicLinkManager({ funnelId }: PublicLinkManagerProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const { data: links, isLoading } = trpc.publicLinks.list.useQuery({ funnelId })
  const createLink = trpc.publicLinks.create.useMutation()
  const deactivateLink = trpc.publicLinks.deactivate.useMutation()
  const utils = trpc.useUtils()

  const handleCreate = async () => {
    await createLink.mutateAsync({ funnelId, expiresInDays: 30 })
    utils.publicLinks.list.invalidate({ funnelId })
  }

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/public/${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <FeatureGate feature="public_link">
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Links Públicos</h3>
          </div>
          <button
            onClick={handleCreate}
            disabled={createLink.isPending}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="w-3 h-3" />
            Criar link
          </button>
        </div>

        {isLoading ? (
          <div className="h-12 bg-muted rounded animate-pulse" />
        ) : links && links.length > 0 ? (
          <div className="space-y-2">
            {links.map((link) => (
              <div key={link.id} className={cn(
                'flex items-center gap-2 p-2 rounded-md text-sm',
                link.isActive ? 'bg-muted/30' : 'bg-muted/10 opacity-50'
              )}>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <code className="flex-1 text-xs truncate">/public/{link.token.slice(0, 12)}...</code>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  {link.viewCount}
                </div>
                {link.isActive && (
                  <>
                    <button onClick={() => handleCopy(link.token)} className="p-1 hover:bg-muted rounded">
                      {copied === link.token ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={async () => {
                        await deactivateLink.mutateAsync({ id: link.id })
                        utils.publicLinks.list.invalidate({ funnelId })
                      }}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhum link público criado.</p>
        )}
      </div>
    </FeatureGate>
  )
}
