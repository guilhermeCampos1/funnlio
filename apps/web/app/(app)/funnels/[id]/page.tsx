import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { api } from '@/lib/trpc-server'
import { FunnelDetailClient } from '@/components/funnels/funnel-detail-client'

export const metadata: Metadata = { title: 'Funil' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function FunnelDetailPage({ params }: Props) {
  const { id } = await params

  let funnel
  try {
    funnel = await api.funnels.getById.query({ id })
  } catch {
    notFound()
  }

  return <FunnelDetailClient funnel={funnel} />
}
