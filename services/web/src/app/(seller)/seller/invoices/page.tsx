import type { Metadata } from 'next'
import InvoicesSellerClient from '@/components/seller/InvoicesSellerClient'
import { serverAuthGet } from '@/lib/server-api'
import type { PaginatedResponse, SellerInvoice } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Invoices — Yerevan Digital Seller',
}

export default async function SellerInvoicesPage() {
  const invoices = await serverAuthGet<PaginatedResponse<SellerInvoice>>('/seller/invoices')
  return <InvoicesSellerClient initialInvoices={invoices?.data ?? []} />
}
