import type { Metadata } from 'next'
import OrdersListClient from '@/components/seller/OrdersListClient'
import { serverAuthGet } from '@/lib/server-api'
import type { Order, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Orders — Vendorex Seller',
}

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const { status, page = '1' } = await searchParams
  const params = new URLSearchParams({ page, per_page: '20' })
  if (status) params.set('status', status)

  const data = await serverAuthGet<PaginatedResponse<Order>>(`/seller/orders?${params.toString()}`)

  return <OrdersListClient initialData={data?.data ?? []} initialMeta={data?.meta} />
}
