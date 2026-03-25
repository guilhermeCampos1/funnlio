import type { Metadata } from 'next'
import { ApiKeysPageClient } from '@/components/settings/api-keys-page-client'

export const metadata: Metadata = { title: 'API Keys' }

export default function ApiKeysPage() {
  return <ApiKeysPageClient />
}
