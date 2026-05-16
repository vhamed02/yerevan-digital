import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { serverGet } from '@/lib/server-api'
import { loadTemplate } from '@/lib/templates'
import type { StorefrontStore, StorefrontProduct } from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>
}): Promise<Metadata> {
  const { slug, productSlug } = await params
  const data = await serverGet<{ data: StorefrontProduct }>(
    `/store/${slug}/products/${productSlug}`
  )
  const product = data?.data
  if (!product) return {}
  const name = product.name.hy || product.name.en
  return {
    title: product.meta_title?.hy ?? `${name} | Vendora`,
    description: product.meta_description?.hy ?? product.description_short?.hy,
    openGraph: {
      title: name,
      ...(product.images?.[0] ? { images: [{ url: product.images[0].large }] } : {}),
    },
  }
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; productSlug: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { slug, productSlug } = await params
  const sp = await searchParams
  const isPreview = sp.preview === 'true'

  const [storeData, productData] = await Promise.all([
    serverGet<{ data: StorefrontStore }>(`/store/${slug}/info`),
    serverGet<{ data: StorefrontProduct }>(`/store/${slug}/products/${productSlug}`),
  ])

  if (!storeData?.data || !productData?.data) notFound()

  const store = storeData.data
  const product = productData.data
  const Template = await loadTemplate(store.active_template_key)

  return (
    <Template.ProductDetail product={product} storeSlug={slug} isPreview={isPreview} />
  )
}
