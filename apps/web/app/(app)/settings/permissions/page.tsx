import type { Metadata } from 'next'
import { PermissionsPageClient } from '@/components/settings/permissions-page-client'

export const metadata: Metadata = { title: 'Permissoes' }

export default function PermissionsPage() {
  return <PermissionsPageClient />
}
