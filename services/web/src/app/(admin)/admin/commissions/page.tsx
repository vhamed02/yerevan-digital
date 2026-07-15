import type { Metadata } from 'next'
import CommissionsAdminClient from '@/components/admin/CommissionsAdminClient'
import { serverAuthGet } from '@/lib/server-api'
import type { AdminCommission, AdminCommissionSummary, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Commissions — Yerevan Digital Admin',
}

export default async function AdminCommissionsPage() {
  const [ledger, summary] = await Promise.all([
    serverAuthGet<PaginatedResponse<AdminCommission>>('/admin/commissions'),
    serverAuthGet<AdminCommissionSummary>('/admin/commissions/summary'),
  ])

  return (
    <CommissionsAdminClient
      initialLedger={ledger?.data ?? []}
      initialSummary={summary ?? null}
    />
  )
}
