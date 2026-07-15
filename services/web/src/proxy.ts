import { NextResponse, type NextRequest } from 'next/server'

const LOCALES = ['en', 'hy', 'ru'] as const
type Locale = (typeof LOCALES)[number]
const DEFAULT_LOCALE: Locale = 'hy'

const ADMIN_PATHS = ['/admin']
const SELLER_PATHS = ['/seller']
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password']

/** Hosts that are the platform itself and must never be treated as a custom domain. */
const PLATFORM_HOSTS = new Set(
  [
    'yerevan.digital',
    'www.yerevan.digital',
    'api.yerevan.digital',
    'localhost',
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '').split('/')[0],
  ].filter(Boolean) as string[],
)

/** Paths that stay on the platform even when reached via a custom domain. */
const PLATFORM_ONLY_PREFIXES = ['/admin', '/seller', '/auth', '/api', '/_next']

function normaliseHost(host: string): string {
  return host.split(':')[0].trim().toLowerCase().replace(/\.$/, '')
}

/**
 * Host -> store slug, cached in memory.
 *
 * The proxy runs on every storefront request, so this must not hit the API each
 * time. Negative results are cached too, or an unmapped host would query on
 * every request. Per-container and short-lived; the API caches behind it as well.
 */
const domainCache = new Map<string, { slug: string | null; expires: number }>()
const DOMAIN_TTL_MS = 60_000

async function resolveStoreSlug(host: string): Promise<string | null> {
  const cached = domainCache.get(host)
  if (cached && cached.expires > Date.now()) return cached.slug

  let slug: string | null = null

  try {
    const base = process.env.SERVER_API_URL ?? 'http://nginx:8080'
    const res = await fetch(`${base}/api/v1/domains/resolve?host=${encodeURIComponent(host)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(2000),
    })

    if (res.ok) {
      const json = (await res.json()) as { data?: { slug?: string } }
      slug = json.data?.slug ?? null
    }
  } catch {
    // A resolver hiccup must not take the platform down — fall through as
    // "not a custom domain" and let the request route normally.
    slug = null
  }

  domainCache.set(host, { slug, expires: Date.now() + DOMAIN_TTL_MS })
  return slug
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const host = normaliseHost(request.headers.get('host') ?? '')

  // Custom storefront domain: serve the store at the domain root, so
  // shop.example.am/products maps to /store/<slug>/products.
  if (
    host &&
    !PLATFORM_HOSTS.has(host) &&
    !PLATFORM_ONLY_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    const slug = await resolveStoreSlug(host)

    if (slug) {
      const url = request.nextUrl.clone()
      const localePrefix = pathname.match(/^\/(en|hy|ru)(\/|$)/)
      const locale = localePrefix ? localePrefix[1] : DEFAULT_LOCALE
      const rest = localePrefix ? pathname.slice(localePrefix[0].length - 1) : pathname

      // Already rewritten (or someone browsed the platform path directly).
      if (!rest.startsWith('/store/')) {
        url.pathname = `/store/${slug}${rest === '/' ? '' : rest}`

        const headers = new Headers(request.headers)
        headers.set('X-NEXT-INTL-LOCALE', locale)
        headers.set('X-Store-Domain', host)

        const response = NextResponse.rewrite(url, { request: { headers } })
        response.cookies.set('NEXT_LOCALE', locale, {
          path: '/',
          maxAge: 365 * 24 * 60 * 60,
          sameSite: 'lax',
        })
        return response
      }
    }
  }

  const localeMatch = pathname.match(/^\/(en|hy|ru)(\/|$)/)
  const detectedLocale: Locale = localeMatch ? (localeMatch[1] as Locale) : DEFAULT_LOCALE

  const afterPrefix = localeMatch ? pathname.slice(localeMatch[0].length) : null
  const bare = localeMatch ? '/' + (afterPrefix ?? '') : pathname

  if (localeMatch && detectedLocale === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone()
    url.pathname = bare
    return NextResponse.redirect(url)
  }

  const token = request.cookies.get('vendora_token')?.value
  const role = request.cookies.get('vendora_role')?.value

  if (ADMIN_PATHS.some((p) => bare.startsWith(p)) && (!token || role !== 'super_admin')) {
    const url = request.nextUrl.clone()
    url.pathname = detectedLocale === DEFAULT_LOCALE ? '/auth/login' : `/${detectedLocale}/auth/login`
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (SELLER_PATHS.some((p) => bare.startsWith(p)) && (!token || role !== 'seller')) {
    const url = request.nextUrl.clone()
    url.pathname = detectedLocale === DEFAULT_LOCALE ? '/auth/login' : `/${detectedLocale}/auth/login`
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (AUTH_PATHS.some((p) => bare.startsWith(p)) && token) {
    const url = request.nextUrl.clone()
    url.pathname = role === 'super_admin' ? '/admin' : '/seller'
    url.search = ''
    return NextResponse.redirect(url)
  }

  const headers = new Headers(request.headers)
  headers.set('X-NEXT-INTL-LOCALE', detectedLocale)

  let response: NextResponse

  if (localeMatch && detectedLocale !== DEFAULT_LOCALE) {
    const url = request.nextUrl.clone()
    url.pathname = bare
    response = NextResponse.rewrite(url, { request: { headers } })
  } else {
    response = NextResponse.next({ request: { headers } })
  }

  response.cookies.set('NEXT_LOCALE', detectedLocale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
  })

  return response
}

export const config = {
  matcher: ['/((?!_next|_vercel|api|.*\\..*).*)'],
}
