import type { Metadata } from 'next'
import { IntegrationsPageClient } from '@/components/integrations/integrations-page-client'

export const metadata: Metadata = { title: 'Integrações' }

export default function IntegrationsPage() {
  return <IntegrationsPageClient />
}
