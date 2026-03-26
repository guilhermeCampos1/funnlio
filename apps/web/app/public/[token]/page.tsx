import { PublicDashboard } from '@/components/public/public-dashboard'

interface Props {
  params: Promise<{ token: string }>
}

export default async function PublicPage({ params }: Props) {
  const { token } = await params
  return <PublicDashboard token={token} />
}
