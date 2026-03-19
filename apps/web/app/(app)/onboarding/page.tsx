'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GitBranch } from 'lucide-react'
import { trpc } from '@/lib/trpc'

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const createOrg = trpc.organizations.create.useMutation({
    onSuccess: () => {
      router.push('/dashboard')
      router.refresh()
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    createOrg.mutate({ name: name.trim() })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Funnlio</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold">Configure seu workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie sua organização para começar a analisar funis de marketing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              Nome da empresa ou agência
            </label>
            <input
              id="name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Minha Empresa"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={!name.trim() || createOrg.isPending}
            className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {createOrg.isPending ? 'Criando...' : 'Criar workspace'}
          </button>
        </form>
      </div>
    </div>
  )
}
