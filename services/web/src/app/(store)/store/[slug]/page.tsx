import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { serverGet } from '@/lib/server-api'
import { loadTemplate } from '@/lib/templates'
import { JsonLd } from '@/components/seo/JsonLd'
import type { StorefrontStore, StorefrontProduct, PublicCategory } from '@/types'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://radif.org'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const store = await serverGet<StorefrontStore>(`/store/${slug}/info`)
  if (!store) return {}
  const name = store.name.hy || store.name.en
  const description = store.meta_description?.hy ?? store.description?.hy
  return {
    title: store.meta_title?.hy ?? `${name} | Vendora`,
    description,
    alternates: { canonical: `/store/${slug}` },
    openGraph: {
      type: 'website',
      title: name,
      description,
      url: `/store/${slug}`,
      ...(store.banner_url ? { images: [{ url: store.banner_url }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      ...(store.banner_url ? { images: [store.banner_url] } : {}),
    },
  }
}

function buildStoreJsonLd(store: StorefrontStore, slug: string): Record<string, unknown> {
  const name = store.name.hy || store.name.en
  const description = store.description?.hy || store.description?.en
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name,
    url: `${BASE_URL}/store/${slug}`,
    ...(description ? { description } : {}),
    ...(store.logo_url ? { logo: store.logo_url } : {}),
    ...(store.banner_url ? { image: store.banner_url } : {}),
    ...(store.email ? { email: store.email } : {}),
    ...(store.phone ? { telephone: store.phone } : {}),
  }
}

export default async function StorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { slug } = await params
  const sp = await searchParams
  const isPreview = sp.preview === 'true'
  const previewTemplateKey = sp.template as string | undefined

  const [storeData, productsData, featuredData, categoriesData] = await Promise.all([
    serverGet<StorefrontStore>(`/store/${slug}/info`),
    serverGet<{ data: StorefrontProduct[]; meta: { current_page: number; last_page: number; total: number } }>(`/store/${slug}/products?limit=12`),
    serverGet<{ data: StorefrontProduct[]; meta: { current_page: number; last_page: number; total: number } }>(`/store/${slug}/products?featured=1&limit=8`),
    serverGet<PublicCategory[]>(`/store/${slug}/categories`),
  ])

  if (!storeData) notFound()
  const store = storeData

  const templateKey =
    isPreview && previewTemplateKey ? previewTemplateKey : store.active_template_key
  const Template = await loadTemplate(templateKey)

  return (
    <>
      {!isPreview && <JsonLd data={buildStoreJsonLd(store, slug)} />}
      <Template.StoreHome
        store={store}
        featuredProducts={featuredData?.data ?? []}
        products={productsData?.data ?? []}
        categories={categoriesData ?? []}
        slug={slug}
        isPreview={isPreview}
      />
    </>
  )
}
