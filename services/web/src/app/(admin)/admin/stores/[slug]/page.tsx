import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import StoreDetailAdminClient from '@/components/admin/StoreDetailAdminClient'
import { serverAuthGet } from '@/lib/server-api'
import type { AdminStore } from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const store = await serverAuthGet<AdminStore>(`/admin/stores/${slug}`)
  const name = store?.name.hy || store?.name.en || slug
  return { title: `${name} — Vendora Admin` }
}

export default async function AdminStoreDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const store = await serverAuthGet<AdminStore>(`/admin/stores/${slug}`)
  if (!store) notFound()
  return <StoreDetailAdminClient store={store} />
}
