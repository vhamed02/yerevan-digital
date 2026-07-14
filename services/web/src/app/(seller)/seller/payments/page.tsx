import type { Metadata } from 'next'
import PaymentsSellerClient from '@/components/seller/PaymentsSellerClient'
import { serverAuthGet } from '@/lib/server-api'
import type { StoreGatewayConfig } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Payments — Yerevan Digital Seller',
}

export default async function SellerPaymentsPage() {
  const gateways = await serverAuthGet<StoreGatewayConfig[]>('/seller/payment-gateways')
  return <PaymentsSellerClient initialGateways={gateways ?? []} />
}
