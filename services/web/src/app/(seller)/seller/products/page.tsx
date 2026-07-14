import type { Metadata } from 'next'
import ProductsListClient from '@/components/seller/ProductsListClient'
import { serverAuthGet, serverGet } from '@/lib/server-api'
import type { SellerProduct, PublicCategory, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Products — Yerevan Digital Seller',
}

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; category?: string; page?: string }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { status, search, category, page = '1' } = await searchParams
  const params = new URLSearchParams({ page, per_page: '15' })
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  if (category) params.set('category', category)

  const [productsData, categoriesData] = await Promise.all([
    serverAuthGet<PaginatedResponse<SellerProduct>>(`/seller/products?${params.toString()}`),
    serverGet<{ data: PublicCategory[] }>('/categories', { next: { revalidate: 3600 } }),
  ])

  return (
    <ProductsListClient
      initialData={productsData?.data ?? []}
      initialMeta={productsData?.meta}
      categories={categoriesData?.data ?? []}
    />
  )
}
