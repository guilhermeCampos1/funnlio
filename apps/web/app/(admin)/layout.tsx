import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session || session.user.role !== 'saas_admin') {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-56 border-r bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <span className="font-bold text-lg">Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {/* Use client component for active state, or just static links */}
          <Link href="/admin/overview" className="block px-3 py-2 rounded-md text-sm hover:bg-muted">Overview</Link>
          <Link href="/admin/organizations" className="block px-3 py-2 rounded-md text-sm hover:bg-muted">Organizações</Link>
          <Link href="/admin/health" className="block px-3 py-2 rounded-md text-sm hover:bg-muted">Saúde (C.H.I.)</Link>
          <Link href="/admin/jobs" className="block px-3 py-2 rounded-md text-sm hover:bg-muted">Jobs</Link>
        </nav>
        <div className="p-4 border-t">
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:underline">← Voltar ao app</Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-6xl p-6">{children}</div>
      </main>
    </div>
  )
}
