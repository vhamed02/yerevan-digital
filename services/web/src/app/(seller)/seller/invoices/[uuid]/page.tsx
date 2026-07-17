import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import InvoiceDetailClient from '@/components/seller/InvoiceDetailClient'
import { serverAuthGet } from '@/lib/server-api'
import type { SellerInvoice, SellerStore } from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ uuid: string }> }): Promise<Metadata> {
  const { uuid } = await params
  const invoice = await serverAuthGet<SellerInvoice>(`/seller/invoices/${uuid}`)
  return { title: `Invoice ${invoice?.number ?? uuid} — Yerevan Digital Seller` }
}

export default async function SellerInvoiceDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params
  const [invoice, store] = await Promise.all([
    serverAuthGet<SellerInvoice>(`/seller/invoices/${uuid}`),
    serverAuthGet<SellerStore>('/seller/store'),
  ])
  if (!invoice) notFound()
  return <InvoiceDetailClient invoice={invoice} store={store ?? null} />
}
