import type { Metadata } from 'next'
import { ReportsPageClient } from '@/components/settings/reports-page-client'

export const metadata: Metadata = { title: 'Configurar Relatorios' }

export default function ReportsSettingsPage() {
  return <ReportsPageClient />
}
