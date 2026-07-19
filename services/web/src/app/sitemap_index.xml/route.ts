import { fetchLatestPost, fetchStoreCount } from '@/lib/sitemap-data'
import { renderSitemapIndex, xmlResponse, type IndexEntry } from '@/lib/sitemap'

// Yoast-style master index. Lists a child sitemap per content type and only
// includes the ones that actually have content, so crawlers never fetch an
// empty urlset. Revalidated hourly.
export const revalidate = 3600

export async function GET() {
  const [storeCount, latestPost] = await Promise.all([fetchStoreCount(), fetchLatestPost()])

  const sitemaps: IndexEntry[] = [{ path: '/page-sitemap.xml' }]

  if (storeCount > 0) {
    sitemaps.push({ path: '/store-sitemap.xml' })
    sitemaps.push({ path: '/product-sitemap.xml' })
  }

  if (latestPost) {
    sitemaps.push({
      path: '/post-sitemap.xml',
      lastmod: latestPost.updated_at ?? latestPost.published_at,
    })
  }

  return xmlResponse(renderSitemapIndex(sitemaps))
}
