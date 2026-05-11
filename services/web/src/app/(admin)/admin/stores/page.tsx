import type { Metadata } from 'next'
import StoresAdminClient from '@/components/admin/StoresAdminClient'
import { serverAuthGet } from '@/lib/server-api'
import type { AdminStore, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Stores — Vendora Admin',
}

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function AdminStoresPage({ searchParams }: PageProps) {
  const { status, search, page = '1' } = await searchParams
  const params = new URLSearchParams({ page, per_page: '20' })
  if (status) params.set('status', status)
  if (search) params.set('search', search)

  const data = await serverAuthGet<PaginatedResponse<AdminStore>>(
    `/admin/stores?${params.toString()}`
  )

  return (
    <StoresAdminClient
      initialData={data?.data ?? []}
      initialMeta={data?.meta}
    />
  )
}
