import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { api } from '@/lib/trpc-server'
import { FunnelStageList } from '@/components/funnels/funnel-stage-list'
import { FunnelHeader } from '@/components/funnels/funnel-header'

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

  return (
    <div className="space-y-6">
      <FunnelHeader funnel={funnel} />
      <FunnelStageList stages={funnel.stages} funnelId={funnel.id} />
    </div>
  )
}
