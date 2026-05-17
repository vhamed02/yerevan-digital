import type { Metadata } from 'next'
import { serverGet } from '@/lib/server-api'
import type { StorefrontOrder } from '@/types'
import { OrderConfirmationClient } from './OrderConfirmationClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Order Status | Vendora' }
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ slug: string; uuid: string }>
}) {
  const { slug, uuid } = await params
  const order = await serverGet<StorefrontOrder>(`/store/${slug}/orders/${uuid}`) ?? null

  return <OrderConfirmationClient order={order} storeSlug={slug} />
}
