'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { MessageSquare, Send, Trash2, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FeatureGate } from '@/components/billing/feature-gate'

interface StageCommentsProps {
  stageId: string
}

export function StageComments({ stageId }: StageCommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const { data: commentsList, isLoading } = trpc.comments.list.useQuery({ stageId })
  const createComment = trpc.comments.create.useMutation()
  const deleteComment = trpc.comments.delete.useMutation()
  const utils = trpc.useUtils()

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    await createComment.mutateAsync({ stageId, content: newComment.trim() })
    setNewComment('')
    utils.comments.list.invalidate({ stageId })
  }

  return (
    <FeatureGate feature="comments">
      <div className="space-y-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">
            {commentsList && commentsList.length > 0
              ? `\uD83D\uDCAC ${commentsList.length} comentário${commentsList.length > 1 ? 's' : ''}`
              : 'Comentários'}
          </h3>
        </button>

        {isExpanded && (
          <>
            {/* Comment list */}
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
              </div>
            ) : commentsList && commentsList.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {commentsList.map((comment) => (
                  <div key={comment.id} className="flex gap-2 p-2 rounded-md bg-muted/30 group">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {comment.userName[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{comment.userName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await deleteComment.mutateAsync({ id: comment.id })
                        utils.comments.list.invalidate({ stageId })
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum comentário nesta etapa.</p>
            )}

            {/* New comment input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Adicionar comentário..."
                className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
              />
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || createComment.isPending}
                className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </FeatureGate>
  )
}
