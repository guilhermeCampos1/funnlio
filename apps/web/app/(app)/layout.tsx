import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { SetupProgress } from '@/components/layout/setup-progress'
import { TrialBanner } from '@/components/billing/trial-banner'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TrialBanner />
        <SetupProgress />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-7xl p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
