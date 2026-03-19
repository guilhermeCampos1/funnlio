'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { trpc } from '@/lib/trpc'

export function CreateFunnelButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6d28d9')

  const createFunnel = trpc.funnels.create.useMutation({
    onSuccess: (funnel) => {
      router.push(`/funnels/${funnel.id}`)
      setOpen(false)
    },
  })

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Novo Funil
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg border shadow-lg w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">Criar novo funil</h2>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1.5">Nome *</label>
            <input
              type="text"
              placeholder="Ex: Webinário de Vendas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Descrição</label>
            <textarea
              placeholder="Descreva o objetivo deste funil..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Cor</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-8 rounded cursor-pointer border"
              />
              <span className="text-sm text-muted-foreground">{color}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setOpen(false)}
            className="flex-1 px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              createFunnel.mutate({ name, description: description || undefined, color })
            }
            disabled={!name.trim() || createFunnel.isPending}
            className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {createFunnel.isPending ? 'Criando...' : 'Criar funil'}
          </button>
        </div>

        {createFunnel.error && (
          <p className="text-sm text-destructive">{createFunnel.error.message}</p>
        )}
      </div>
    </div>
  )
}
