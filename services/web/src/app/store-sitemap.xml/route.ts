import { fetchAllStores } from '@/lib/sitemap-data'
import { renderUrlset, storeOrigin, xmlResponse, type SitemapEntry } from '@/lib/sitemap'

// Store pages: the platform-hosted profile page (`/stores/<slug>`) plus the
// storefront home, which lives on the store's own subdomain — that subdomain is
// the canonical URL (the apex `/store/<slug>` 301-redirects there), so the
// sitemap must point straight at it, never at the redirect.
export const revalidate = 3600

export async function GET() {
  const stores = await fetchAllStores()

  const entries: SitemapEntry[] = stores.flatMap((store): SitemapEntry[] => [
    {
      path: `/stores/${store.slug}`,
      changefreq: 'weekly',
      priority: 0.7,
    },
    {
      origin: storeOrigin(store.slug),
      path: '/',
      changefreq: 'daily',
      priority: 0.9,
    },
  ])

  return xmlResponse(renderUrlset(entries))
}
