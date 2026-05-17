import { serverGet } from '@/lib/server-api'
import { SandboxPayClient } from './SandboxPayClient'
import type { StorefrontOrder } from '@/types'

export const dynamic = 'force-dynamic'

export default async function SandboxPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ order_id?: string }>
}) {
  const { slug } = await params
  const { order_id: orderId } = await searchParams

  let amount = '0.00'
  let currency = 'AMD'

  if (orderId) {
    const order = await serverGet<StorefrontOrder>(`/store/${slug}/orders/${orderId}`)
    if (order) {
      amount = Number(order.total).toFixed(2)
      currency = order.currency ?? 'AMD'
    }
  }

  return (
    <SandboxPayClient
      orderId={orderId ?? ''}
      amount={amount}
      currency={currency}
      apiUrl={process.env.NEXT_PUBLIC_API_URL ?? ''}
    />
  )
}
