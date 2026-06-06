import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SellerDetailClient from '@/components/admin/SellerDetailClient'
import { serverAuthGet } from '@/lib/server-api'
import type { AdminSeller } from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const seller = await serverAuthGet<AdminSeller>(`/admin/sellers/${id}`)
  return { title: `${seller?.name ?? 'Seller'} — Vendorex Admin` }
}

export default async function SellerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const seller = await serverAuthGet<AdminSeller>(`/admin/sellers/${id}`)
  if (!seller) notFound()
  return <SellerDetailClient seller={seller} />
}
