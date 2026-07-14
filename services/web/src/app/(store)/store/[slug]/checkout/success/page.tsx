import type { Metadata } from 'next'
import { serverGet } from '@/lib/server-api'
import type { StorefrontOrder } from '@/types'
import { OrderConfirmationClient } from '../../order/[uuid]/OrderConfirmationClient'
import { CartClearer } from './CartClearer'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Order Confirmed | Yerevan Digital' }
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { slug } = await params
  const { order: orderUuid } = await searchParams

  const order = orderUuid
    ? (await serverGet<StorefrontOrder>(`/store/${slug}/orders/${orderUuid}`)) ?? null
    : null

  return (
    <>
      <CartClearer storeSlug={slug} />
      <OrderConfirmationClient order={order} storeSlug={slug} isNew />
    </>
  )
}
