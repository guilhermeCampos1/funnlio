import type { Metadata } from 'next'
import { AuditLogClient } from '@/components/settings/audit-log-client'

export const metadata: Metadata = { title: 'Audit Log' }

export default function AuditPage() {
  return <AuditLogClient />
}
