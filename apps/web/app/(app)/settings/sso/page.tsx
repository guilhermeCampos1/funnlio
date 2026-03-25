import type { Metadata } from 'next'
import { SSOPageClient } from '@/components/settings/sso-page-client'

export const metadata: Metadata = {
  title: 'SSO — Funnlio',
}

export default function SSOPage() {
  return <SSOPageClient />
}
