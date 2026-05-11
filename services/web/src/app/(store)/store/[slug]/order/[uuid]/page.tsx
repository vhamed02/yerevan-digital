import type { Metadata } from 'next'
import Link from 'next/link'
import { serverGet } from '@/lib/server-api'
import type { StorefrontOrder } from '@/types'
import { OrderConfirmationClient } from './OrderConfirmationClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Order Confirmed | Vendora' }
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ slug: string; uuid: string }>
}) {
  const { slug, uuid } = await params
  const data = await serverGet<{ data: StorefrontOrder }>(`/store/${slug}/orders/${uuid}`)
  const order = data?.data ?? null

  return <OrderConfirmationClient order={order} storeSlug={slug} />
}
