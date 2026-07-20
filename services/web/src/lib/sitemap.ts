import { routing } from '@/i18n/routing'
import { localePath } from '@/lib/seo'

/**
 * Yoast-style sitemap plumbing. One index (`/sitemap_index.xml`) points at a
 * child sitemap per content type (`page-`, `store-`, `product-`, `post-`), each
 * an XML `<urlset>`. Every content URL is emitted once, at the default-locale
 * (Armenian) `<loc>`, with `xhtml:link` hreflang alternates for hy/en/ru plus
 * `x-default` — the correct multilingual sitemap shape, not one URL per locale.
 */

/** Canonical platform origin, no trailing slash. */
export const SITEMAP_BASE = (
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://yerevan.digital'
).replace(/\/$/, '')

/** Apex host, e.g. `yerevan.digital`. Storefronts live at `<slug>.<host>`. */
export const PLATFORM_HOST =
  process.env.NEXT_PUBLIC_PLATFORM_HOST ?? SITEMAP_BASE.replace(/^https?:\/\//, '')

/** Google caps a single sitemap at 50,000 URLs / 50 MB. */
export const SITEMAP_LIMIT = 50000

/**
 * Yoast-style stylesheet reference. Search engines ignore it; browsers render
 * the XML as a styled, clickable table (see app/sitemap.xsl/route.ts).
 */
const STYLESHEET = `<?xml-stylesheet type="text/xsl" href="${SITEMAP_BASE}/sitemap.xsl"?>`

/** A store's public storefront lives on its own subdomain, over HTTPS. */
export function storeOrigin(slug: string): string {
  return `https://${slug}.${PLATFORM_HOST}`
}

export type ChangeFreq =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never'

export interface SitemapEntry {
  /** Locale-agnostic path, e.g. `/blog/foo` or `/products/bar`. */
  path: string
  /** Origin this path lives on. Defaults to the platform apex. */
  origin?: string
  lastmod?: string | Date | null
  changefreq?: ChangeFreq
  priority?: number
  /** Absolute image URLs for a Google image sitemap. */
  images?: string[]
  /** Emit hreflang alternates. Default true. */
  localized?: boolean
}

export interface IndexEntry {
  path: string
  lastmod?: string | Date | null
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toW3C(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

function loc(origin: string, path: string): string {
  return xmlEscape(`${origin}${path}`)
}

function alternates(origin: string, path: string): string {
  const links = routing.locales.map(
    (l) =>
      `<xhtml:link rel="alternate" hreflang="${l}" href="${loc(origin, localePath(l, path))}"/>`,
  )
  links.push(
    `<xhtml:link rel="alternate" hreflang="x-default" href="${loc(
      origin,
      localePath(routing.defaultLocale, path),
    )}"/>`,
  )
  return links.join('')
}

export function renderUrlset(entries: SitemapEntry[]): string {
  const urls = entries
    .slice(0, SITEMAP_LIMIT)
    .map((entry) => {
      const origin = entry.origin ?? SITEMAP_BASE
      const parts: string[] = [
        `<loc>${loc(origin, localePath(routing.defaultLocale, entry.path))}</loc>`,
      ]
      if (entry.localized !== false) parts.push(alternates(origin, entry.path))
      if (entry.lastmod) parts.push(`<lastmod>${toW3C(entry.lastmod)}</lastmod>`)
      if (entry.changefreq) parts.push(`<changefreq>${entry.changefreq}</changefreq>`)
      if (entry.priority != null) parts.push(`<priority>${entry.priority.toFixed(1)}</priority>`)
      for (const image of entry.images ?? []) {
        parts.push(`<image:image><image:loc>${xmlEscape(image)}</image:loc></image:image>`)
      }
      return `  <url>\n    ${parts.join('\n    ')}\n  </url>`
    })
    .join('\n')

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `${STYLESHEET}\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
    `xmlns:xhtml="http://www.w3.org/1999/xhtml" ` +
    `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    `${urls}\n</urlset>\n`
  )
}

export function renderSitemapIndex(sitemaps: IndexEntry[]): string {
  const items = sitemaps
    .map((s) => {
      const parts = [`<loc>${xmlEscape(`${SITEMAP_BASE}${s.path}`)}</loc>`]
      if (s.lastmod) parts.push(`<lastmod>${toW3C(s.lastmod)}</lastmod>`)
      return `  <sitemap>\n    ${parts.join('\n    ')}\n  </sitemap>`
    })
    .join('\n')

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `${STYLESHEET}\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${items}\n</sitemapindex>\n`
  )
}

/** Cacheable XML response — 1 h fresh, serve-stale for a day while revalidating. */
export function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
