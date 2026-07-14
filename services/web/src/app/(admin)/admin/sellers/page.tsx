import type { Metadata } from 'next'
import SellersClient from '@/components/admin/SellersClient'
import { serverAuthGet } from '@/lib/server-api'
import type { AdminSeller, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sellers — Yerevan Digital Admin',
}

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}

export default async function SellersPage({ searchParams }: PageProps) {
  const { search, status, page = '1' } = await searchParams
  const params = new URLSearchParams({ page, per_page: '20' })
  if (search) params.set('search', search)
  if (status) params.set('status', status)

  const data = await serverAuthGet<PaginatedResponse<AdminSeller>>(
    `/admin/sellers?${params.toString()}`
  )

  return (
    <SellersClient
      initialData={data?.data ?? []}
      initialMeta={data?.meta}
    />
  )
}
