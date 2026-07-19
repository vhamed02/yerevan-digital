import { renderUrlset, xmlResponse, type SitemapEntry } from '@/lib/sitemap'

// Static, evergreen marketing/legal pages on the platform apex. Each is emitted
// once with hy/en/ru + x-default hreflang alternates.
export const revalidate = 3600

const STATIC_PAGES: SitemapEntry[] = [
  { path: '/',        changefreq: 'daily',   priority: 1.0 },
  { path: '/stores',  changefreq: 'hourly',  priority: 0.9 },
  { path: '/blog',    changefreq: 'daily',   priority: 0.8 },
  { path: '/about',   changefreq: 'monthly', priority: 0.5 },
  { path: '/contact', changefreq: 'monthly', priority: 0.5 },
  { path: '/terms',   changefreq: 'yearly',  priority: 0.3 },
  { path: '/privacy', changefreq: 'yearly',  priority: 0.3 },
]

export async function GET() {
  return xmlResponse(renderUrlset(STATIC_PAGES))
}
