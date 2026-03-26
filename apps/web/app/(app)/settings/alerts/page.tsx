import type { Metadata } from 'next'
import { AlertsPageClient } from '@/components/settings/alerts-page-client'

export const metadata: Metadata = { title: 'Alertas' }

export default function AlertsPage() {
  return <AlertsPageClient />
}
