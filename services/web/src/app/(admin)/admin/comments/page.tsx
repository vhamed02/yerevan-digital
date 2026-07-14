import type { Metadata } from 'next'
import { serverAuthGet } from '@/lib/server-api'
import CommentsAdminClient from '@/components/admin/CommentsAdminClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Comments — Yerevan Digital Admin',
}

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function AdminCommentsPage({ searchParams }: PageProps) {
  const { status = 'pending', page = '1' } = await searchParams
  const params = new URLSearchParams({ status, page, per_page: '25' })

  const data = await serverAuthGet<{
    data: AdminComment[]
    meta: { current_page: number; last_page: number; total: number }
  }>(`/admin/comments?${params}`)

  return (
    <CommentsAdminClient
      initialData={data?.data ?? []}
      initialMeta={data?.meta}
      initialStatus={status}
    />
  )
}

export interface AdminComment {
  id: number
  author_name: string
  author_email: string | null
  body: string
  is_approved: boolean
  created_at: string
  post: { slug: string | null; title: { hy?: string; en?: string; ru?: string } | null }
}
