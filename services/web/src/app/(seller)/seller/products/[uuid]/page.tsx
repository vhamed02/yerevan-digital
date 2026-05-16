import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductForm from '@/components/seller/ProductForm'
import { serverAuthGet, serverGet } from '@/lib/server-api'
import type { SellerProduct, PublicCategory } from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ uuid: string }> }): Promise<Metadata> {
  const { uuid } = await params
  const product = await serverAuthGet<SellerProduct>(`/seller/products/${uuid}`)
  const name = product?.name.hy || product?.name.en || 'Edit Product'
  return { title: `Edit: ${name} — Vendora Seller` }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params
  const [product, categories] = await Promise.all([
    serverAuthGet<SellerProduct>(`/seller/products/${uuid}`),
    serverGet<PublicCategory[]>('/categories', { next: { revalidate: 3600 } }),
  ])
  if (!product) notFound()
  return <ProductForm product={product} categories={categories ?? []} />
}
