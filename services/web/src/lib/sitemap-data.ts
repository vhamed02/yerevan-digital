import type {
  PaginatedResponse,
  PublicPostListItem,
  PublicStore,
  StorefrontProduct,
} from '@/types'

/**
 * Data access for the sitemaps. Deliberately does NOT use `server-api.ts`:
 * that helper reads `headers()` (for per-request client IP), which opts the
 * whole route into dynamic rendering and defeats caching. Sitemaps want the
 * opposite — a plain, revalidated fetch so the XML is cached for an hour.
 */

const API_BASE =
  (process.env.SERVER_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000') +
  '/api/v1'

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const json: unknown = await res.json()
    // Mirror server-api's unwrap: strip the { success, data } envelope, but
    // leave paginated { data, meta } bodies (no `success` key) untouched.
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return ((json as { data: T }).data ?? null) as T
    }
    return json as T
  } catch {
    return null
  }
}

export async function fetchAllStores(): Promise<PublicStore[]> {
  const result = await apiGet<PaginatedResponse<PublicStore>>('/stores?per_page=200')
  return result?.data ?? []
}

/** Total number of public stores, via the pagination meta (one lightweight row). */
export async function fetchStoreCount(): Promise<number> {
  const result = await apiGet<PaginatedResponse<PublicStore>>('/stores?per_page=1')
  return result?.meta?.total ?? result?.data?.length ?? 0
}

export async function fetchStoreProducts(slug: string): Promise<StorefrontProduct[]> {
  const result = await apiGet<PaginatedResponse<StorefrontProduct>>(
    `/store/${slug}/products?per_page=500`,
  )
  return result?.data ?? []
}

export async function fetchAllPosts(): Promise<PublicPostListItem[]> {
  const posts: PublicPostListItem[] = []
  for (let page = 1; page <= 50; page++) {
    const result = await apiGet<PaginatedResponse<PublicPostListItem>>(
      `/posts?per_page=20&page=${page}`,
    )
    if (!result?.data?.length) break
    posts.push(...result.data)
    if (page >= (result.meta?.last_page ?? 1)) break
  }
  return posts
}

/** The single most-recently-updated post, for the index `<lastmod>`. */
export async function fetchLatestPost(): Promise<PublicPostListItem | null> {
  const result = await apiGet<PaginatedResponse<PublicPostListItem>>('/posts?per_page=1')
  return result?.data?.[0] ?? null
}
