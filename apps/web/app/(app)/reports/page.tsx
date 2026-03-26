import type { Metadata } from 'next'
import { ReportsViewClient } from '@/components/reports/reports-view-client'

export const metadata: Metadata = { title: 'Relatorios' }

export default function ReportsPage() {
  return <ReportsViewClient />
}
