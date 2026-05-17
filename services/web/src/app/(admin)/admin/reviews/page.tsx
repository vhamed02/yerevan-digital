import type { Metadata } from 'next'
import { serverAuthGet } from '@/lib/server-api'
import ReviewsAdminClient from '@/components/admin/ReviewsAdminClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reviews — Vendora Admin',
}

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  const { status = 'pending', page = '1' } = await searchParams
  const params = new URLSearchParams({ status, page, per_page: '25' })

  const data = await serverAuthGet<{
    data: AdminReview[]
    meta: { current_page: number; last_page: number; total: number }
  }>(`/admin/reviews?${params}`)

  return (
    <ReviewsAdminClient
      initialData={data?.data ?? []}
      initialMeta={data?.meta}
      initialStatus={status}
    />
  )
}

export interface AdminReview {
  id: number
  reviewer_name: string
  reviewer_email: string | null
  rating: number
  body: string | null
  is_approved: boolean
  created_at: string
  product: { name: { hy?: string; en?: string }; slug: string }
  store: { name: { hy?: string; en?: string }; slug: string }
}
