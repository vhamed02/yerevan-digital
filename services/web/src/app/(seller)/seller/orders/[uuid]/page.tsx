import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import OrderDetailClient from '@/components/seller/OrderDetailClient'
import { serverAuthGet } from '@/lib/server-api'
import type { Order } from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ uuid: string }> }): Promise<Metadata> {
  const { uuid } = await params
  const order = await serverAuthGet<Order>(`/seller/orders/${uuid}`)
  return { title: `Order ${order?.order_number ?? uuid} — Vendora Seller` }
}

export default async function OrderDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params
  const order = await serverAuthGet<Order>(`/seller/orders/${uuid}`)
  if (!order) notFound()
  return <OrderDetailClient order={order} />
}
