import { fetchAllStores, fetchStoreProducts } from '@/lib/sitemap-data'
import { renderUrlset, storeOrigin, xmlResponse, type SitemapEntry } from '@/lib/sitemap'

// Every active product, addressed by its canonical storefront subdomain URL
// (`https://<slug>.yerevan.digital/products/<product-slug>`) with a Google image
// entry for the primary photo. hreflang alternates cover hy/en/ru.
export const revalidate = 3600

export async function GET() {
  const stores = await fetchAllStores()

  const perStore = await Promise.all(
    stores.map(async (store): Promise<SitemapEntry[]> => {
      const origin = storeOrigin(store.slug)
      const products = await fetchStoreProducts(store.slug)
      return products.map((product) => ({
        origin,
        path: `/products/${product.slug}`,
        changefreq: 'weekly',
        priority: 0.7,
        images: (product.images ?? [])
          .map((img) => img.large || img.medium || img.original)
          .filter((url): url is string => Boolean(url)),
      }))
    }),
  )

  return xmlResponse(renderUrlset(perStore.flat()))
}
