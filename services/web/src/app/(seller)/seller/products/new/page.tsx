import type { Metadata } from 'next'
import ProductForm from '@/components/seller/ProductForm'
import { serverGet } from '@/lib/server-api'
import type { PublicCategory } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'New Product — Vendora Seller',
}

export default async function NewProductPage() {
  const data = await serverGet<{ data: PublicCategory[] }>('/categories', {
    next: { revalidate: 3600 },
  })
  return <ProductForm categories={data?.data ?? []} />
}
