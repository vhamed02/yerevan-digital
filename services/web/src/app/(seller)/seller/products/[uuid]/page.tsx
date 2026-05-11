import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductForm from '@/components/seller/ProductForm'
import { serverAuthGet, serverGet } from '@/lib/server-api'
import type { SellerProduct, PublicCategory } from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ uuid: string }> }): Promise<Metadata> {
  const { uuid } = await params
  const product = await serverAuthGet<{ data: SellerProduct }>(`/seller/products/${uuid}`)
  const name = product?.data.name.hy || product?.data.name.en || 'Edit Product'
  return { title: `Edit: ${name} — Vendora Seller` }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params
  const [productData, categoriesData] = await Promise.all([
    serverAuthGet<{ data: SellerProduct }>(`/seller/products/${uuid}`),
    serverGet<{ data: PublicCategory[] }>('/categories', { next: { revalidate: 3600 } }),
  ])
  if (!productData?.data) notFound()
  return <ProductForm product={productData.data} categories={categoriesData?.data ?? []} />
}
