import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { serverGet } from '@/lib/server-api'
import { loadTemplate } from '@/lib/templates'
import { getLocale } from 'next-intl/server'
import { ViewRecorder } from '@/components/store/ViewRecorder'
import { JsonLd } from '@/components/seo/JsonLd'
import { pickLang } from '@/lib/i18n'
import { localePath, localizedAlternates, ogLocale } from '@/lib/seo'
import type { StorefrontStore, StorefrontProduct } from '@/types'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://radif.org'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>
}): Promise<Metadata> {
  const { slug, productSlug } = await params
  const locale = await getLocale()
  const product = await serverGet<StorefrontProduct>(
    `/store/${slug}/products/${productSlug}`
  )
  if (!product) return {}
  const name = pickLang(product.name, locale)
  const description = pickLang(product.meta_description, locale) || pickLang(product.description_short, locale) || undefined
  const image = product.images?.[0]?.large
  return {
    title: pickLang(product.meta_title, locale) || `${name} | Vendorex`,
    description,
    alternates: localizedAlternates(`/store/${slug}/products/${productSlug}`, locale),
    openGraph: {
      type: 'website',
      title: name,
      description,
      url: localePath(locale, `/store/${slug}/products/${productSlug}`),
      ...ogLocale(locale),
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

function buildProductJsonLd(
  product: StorefrontProduct,
  slug: string,
  locale: string
): Record<string, unknown> {
  const name = pickLang(product.name, locale)
  const url = `${BASE_URL}/store/${slug}/products/${product.slug}`
  const inStock = !product.manage_stock || product.stock > 0
  const images = (product.images ?? []).map((img) => img.large)
  const description = pickLang(product.description_short, locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    ...(description ? { description } : {}),
    ...(images.length ? { image: images } : {}),
    ...(product.category
      ? { category: pickLang(product.category.name, locale) }
      : {}),
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'AMD',
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url,
    },
    ...(product.rating_count && product.rating_count > 0 && product.rating_avg != null
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating_avg,
            reviewCount: product.rating_count,
          },
        }
      : {}),
  }
}

function buildBreadcrumbJsonLd(
  store: StorefrontStore,
  product: StorefrontProduct,
  slug: string,
  locale: string
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: pickLang(store.name, locale),
        item: `${BASE_URL}/store/${slug}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: pickLang(product.name, locale),
        item: `${BASE_URL}/store/${slug}/products/${product.slug}`,
      },
    ],
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
  const locale = await getLocale()
  const sp = await searchParams
  const isPreview = sp.preview === 'true'

  const [storeData, productData] = await Promise.all([
    serverGet<StorefrontStore>(`/store/${slug}/info`),
    serverGet<StorefrontProduct>(`/store/${slug}/products/${productSlug}`),
  ])

  if (!storeData || !productData) notFound()

  const store = storeData
  const product = productData
  const Template = await loadTemplate(store.active_template_key)

  return (
    <>
      {!isPreview && (
        <>
          <JsonLd data={buildProductJsonLd(product, slug, locale)} />
          <JsonLd data={buildBreadcrumbJsonLd(store, product, slug, locale)} />
        </>
      )}
      <Template.ProductDetail product={product} storeSlug={slug} isPreview={isPreview} />
      {!isPreview && <ViewRecorder storeSlug={slug} productSlug={productSlug} />}
    </>
  )
}
