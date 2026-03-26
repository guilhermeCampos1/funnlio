import type { Metadata } from 'next'
import { MembersPageClient } from '@/components/settings/members-page-client'

export const metadata: Metadata = { title: 'Membros' }

export default function MembersPage() {
  return <MembersPageClient />
}
