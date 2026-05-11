import type { Metadata } from 'next'
import CategoriesAdminClient from '@/components/admin/CategoriesAdminClient'
import { serverAuthGet } from '@/lib/server-api'
import type { AdminCategory } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Categories — Vendora Admin',
}

export default async function CategoriesPage() {
  const data = await serverAuthGet<{ data: AdminCategory[] }>('/admin/categories')
  return <CategoriesAdminClient initialCategories={data?.data ?? []} />
}
