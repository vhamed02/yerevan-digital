import type { MetadataRoute } from 'next'
import { serverGet } from '@/lib/server-api'
import { localePath } from '@/lib/seo'
import { routing } from '@/i18n/routing'
import type { PaginatedResponse, PublicPostListItem, PublicStore, StorefrontProduct } from '@/types'

export const revalidate = 3600

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: '/',        changeFrequency: 'daily',   priority: 1.0 },
  { url: '/stores',  changeFrequency: 'hourly',  priority: 0.9 },
  { url: '/blog',    changeFrequency: 'daily',   priority: 0.8 },
  { url: '/about',   changeFrequency: 'monthly', priority: 0.5 },
  { url: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { url: '/terms',   changeFrequency: 'yearly',  priority: 0.3 },
  { url: '/privacy', changeFrequency: 'yearly',  priority: 0.3 },
]

async function fetchAllStores(): Promise<PublicStore[]> {
  const result = await serverGet<PaginatedResponse<PublicStore>>('/stores?per_page=200')
  return result?.data ?? []
}

async function fetchStoreProducts(slug: string): Promise<StorefrontProduct[]> {
  const result = await serverGet<PaginatedResponse<StorefrontProduct>>(
    `/store/${slug}/products?per_page=500`
  )
  return result?.data ?? []
}

async function fetchAllPosts(): Promise<PublicPostListItem[]> {
  const posts: PublicPostListItem[] = []

  for (let page = 1; page <= 50; page++) {
    const result = await serverGet<PaginatedResponse<PublicPostListItem>>(
      `/posts?per_page=20&page=${page}`
    )
    if (!result?.data?.length) break
    posts.push(...result.data)
    if (page >= (result.meta?.last_page ?? 1)) break
  }

  return posts
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vendorex.shop'

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((entry) => ({
    ...entry,
    url: `${base}${entry.url}`,
    lastModified: new Date(),
  }))

  const stores = await fetchAllStores()

  const storeEntries: MetadataRoute.Sitemap = stores.flatMap((store) => [
    {
      url: `${base}/stores/${store.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: `${base}/store/${store.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.9,
      lastModified: new Date(),
    },
  ])

  const productResults = await Promise.all(
    stores.map(async (store) => {
      const products = await fetchStoreProducts(store.slug)
      return products.map((product): MetadataRoute.Sitemap[number] => ({
        url: `${base}/store/${store.slug}/products/${product.slug}`,
        changeFrequency: 'weekly',
        priority: 0.7,
        lastModified: new Date(),
      }))
    })
  )

  const posts = await fetchAllPosts()

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
    lastModified: new Date(post.updated_at ?? post.published_at ?? Date.now()),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${base}${localePath(l, `/blog/${post.slug}`)}`])
      ),
    },
  }))

  return [...staticEntries, ...storeEntries, ...productResults.flat(), ...postEntries]
}
