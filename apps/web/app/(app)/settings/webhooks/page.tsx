import type { Metadata } from 'next'
import { WebhooksPageClient } from '@/components/settings/webhooks-page-client'

export const metadata: Metadata = { title: 'Webhooks' }

export default function WebhooksPage() {
  return <WebhooksPageClient />
}
