import { fetchAllPosts } from '@/lib/sitemap-data'
import { renderUrlset, xmlResponse, type SitemapEntry } from '@/lib/sitemap'

// Blog posts on the platform apex. Real `<lastmod>` from each post's
// updated_at/published_at, with hy/en/ru + x-default alternates.
export const revalidate = 3600

export async function GET() {
  const posts = await fetchAllPosts()

  const entries: SitemapEntry[] = posts.map((post) => ({
    path: `/blog/${post.slug}`,
    lastmod: post.updated_at ?? post.published_at,
    changefreq: 'weekly',
    priority: 0.7,
  }))

  return xmlResponse(renderUrlset(entries))
}
