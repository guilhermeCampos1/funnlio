'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  Bell,
  Code2,
  CreditCard,
  FileText,
  GitBranch,
  Key,
  LogOut,
  Plug,
  ScrollText,
  Settings,
  ShieldCheck,
  Webhook,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth-client'
import { OrgSwitcher } from './org-switcher'
import { PlanBadge } from '@/components/billing/plan-badge'
import { NotificationBell } from './notification-bell'
import { trpc } from '@/lib/trpc'

interface SidebarProps {
  user: { id: string; name?: string | null; email: string; role?: string }
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/settings/alerts', label: 'Alertas', icon: Bell },
  { href: '/reports', label: 'Relatorios', icon: FileText },
  { href: '/integrations', label: 'Integracoes', icon: Plug },
  { href: '/settings/billing', label: 'Plano', icon: CreditCard },
  { href: '/settings', label: 'Configuracoes', icon: Settings },
]

const advancedItems = [
  { href: '/settings/api', label: 'API Keys', icon: Key },
  { href: '/settings/webhooks', label: 'Webhooks', icon: Webhook },
  { href: '/settings/audit', label: 'Auditoria', icon: ScrollText },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: subscription } = trpc.billing.getSubscription.useQuery()

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    if (href === '/settings') {
      return (
        pathname === '/settings' ||
        (pathname.startsWith('/settings/') &&
          ![
            '/settings/alerts',
            '/settings/billing',
            '/settings/api',
            '/settings/webhooks',
            '/settings/audit',
          ].some((p) => pathname.startsWith(p)))
      )
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Funnlio</span>
        </Link>
      </div>

      {/* Org Switcher + Plan Badge + Bell */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <OrgSwitcher />
          <div className="flex items-center gap-1">
            <NotificationBell />
            {subscription?.plan && (
              <PlanBadge plan={subscription.plan} size="sm" />
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive(href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}

        {/* Avancado section */}
        <div className="pt-4 mt-4 border-t">
          <p className="px-3 pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Avancado
          </p>
          {advancedItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive(href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Admin link */}
        {user.role === 'saas_admin' && (
          <Link
            href="/admin/overview"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mt-4',
              pathname.startsWith('/admin')
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            Admin SaaS
          </Link>
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
            {(user.name ?? user.email)[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name ?? 'Sem nome'}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
