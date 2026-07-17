import type { Metadata } from 'next'
import InvoicesAdminClient from '@/components/admin/InvoicesAdminClient'
import { serverAuthGet } from '@/lib/server-api'
import type { AdminInvoice, AdminInvoiceSummary, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Invoices — Yerevan Digital Admin',
}

export default async function AdminInvoicesPage() {
  const [invoices, summary] = await Promise.all([
    serverAuthGet<PaginatedResponse<AdminInvoice>>('/admin/invoices'),
    serverAuthGet<AdminInvoiceSummary>('/admin/invoices/summary'),
  ])

  return (
    <InvoicesAdminClient
      initialInvoices={invoices?.data ?? []}
      initialSummary={summary ?? null}
    />
  )
}
