'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, CreditCard, Bell, FileText, Key, Webhook, Shield, ScrollText } from 'lucide-react'
import { cn } from '@/lib/utils'

const settingsLinks = [
  { href: '/settings/members', label: 'Membros', icon: Users, description: 'Gerenciar membros da organização' },
  { href: '/settings/billing', label: 'Plano e Faturamento', icon: CreditCard, description: 'Plano atual, upgrade e faturas' },
  { href: '/settings/alerts', label: 'Alertas', icon: Bell, description: 'Configurar notificações por email e Slack' },
  { href: '/settings/reports', label: 'Relatórios', icon: FileText, description: 'Relatórios automáticos por email' },
  { href: '/settings/permissions', label: 'Permissões', icon: Shield, description: 'Níveis de acesso por membro' },
  { href: '/settings/api', label: 'API Keys', icon: Key, description: 'Chaves de acesso à API pública' },
  { href: '/settings/webhooks', label: 'Webhooks', icon: Webhook, description: 'Endpoints e eventos em tempo real' },
  { href: '/settings/audit', label: 'Auditoria', icon: ScrollText, description: 'Log de ações da organização' },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie sua organização e preferências</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {settingsLinks.map(({ href, label, icon: Icon, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-3 rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10">
              <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
