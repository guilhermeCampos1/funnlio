import type { Metadata } from 'next'
import { BillingPageClient } from '@/components/settings/billing-page-client'

export const metadata: Metadata = { title: 'Plano e Faturamento' }

export default function BillingPage() {
  return <BillingPageClient />
}
