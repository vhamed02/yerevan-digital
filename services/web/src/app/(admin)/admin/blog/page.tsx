import type { Metadata } from 'next'
import BlogAdminClient from '@/components/admin/BlogAdminClient'
import { serverAuthGet } from '@/lib/server-api'
import type { AdminPostListItem, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog — Vendorex Admin',
}

const emptyList: PaginatedResponse<AdminPostListItem> = {
  data: [],
  meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
}

export default async function BlogPage() {
  const posts = await serverAuthGet<PaginatedResponse<AdminPostListItem>>('/admin/posts')
  return <BlogAdminClient initialPosts={posts ?? emptyList} />
}
