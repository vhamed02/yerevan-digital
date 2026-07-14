import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { serverGet } from '@/lib/server-api'
import { loadTemplate } from '@/lib/templates'
import { JsonLd } from '@/components/seo/JsonLd'
import { pickLang } from '@/lib/i18n'
import { localePath, localizedAlternates, ogLocale } from '@/lib/seo'
import type { StorefrontStore, StorefrontProduct, PublicCategory } from '@/types'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://radif.org'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const locale = await getLocale()
  const store = await serverGet<StorefrontStore>(`/store/${slug}/info`)
  if (!store) return {}
  const name = pickLang(store.name, locale)
  const description = pickLang(store.meta_description, locale) || pickLang(store.description, locale) || undefined
  return {
    title: pickLang(store.meta_title, locale) || `${name} | Yerevan Digital`,
    description,
    alternates: localizedAlternates(`/store/${slug}`, locale),
    openGraph: {
      type: 'website',
      title: name,
      description,
      url: localePath(locale, `/store/${slug}`),
      ...ogLocale(locale),
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

function buildStoreJsonLd(store: StorefrontStore, slug: string, locale: string): Record<string, unknown> {
  const name = pickLang(store.name, locale)
  const description = pickLang(store.description, locale)
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
  const locale = await getLocale()
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
      {!isPreview && <JsonLd data={buildStoreJsonLd(store, slug, locale)} />}
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
