import type { Metadata } from 'next'
import PaymentsAdminClient from '@/components/admin/PaymentsAdminClient'
import { serverAuthGet } from '@/lib/server-api'
import type { AdminPaymentGateway } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Payment Gateways — Vendorex Admin',
}

export default async function AdminPaymentsPage() {
  const data = await serverAuthGet<{ data: AdminPaymentGateway[] }>('/admin/payment-gateways')
  return <PaymentsAdminClient initialGateways={data?.data ?? []} />
}
