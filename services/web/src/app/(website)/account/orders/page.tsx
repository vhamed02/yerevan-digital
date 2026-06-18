import type { Metadata } from 'next'
import { serverAuthGet } from '@/lib/server-api'
import type { AccountOrder, PaginatedResponse } from '@/types'
import AccountOrdersClient from './AccountOrdersClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Orders — Vendorex',
}

export default async function AccountOrdersPage() {
  const data = await serverAuthGet<PaginatedResponse<AccountOrder>>('/customer/orders')

  return <AccountOrdersClient orders={data?.data ?? null} />
}
