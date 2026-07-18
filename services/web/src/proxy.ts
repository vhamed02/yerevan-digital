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

/** The platform host. Every store's canonical URL is `<slug>.<PLATFORM_HOST>`. */
const PLATFORM_HOST = process.env.NEXT_PUBLIC_PLATFORM_HOST ?? 'yerevan.digital'

function normaliseHost(host: string): string {
  return host.split(':')[0].trim().toLowerCase().replace(/\.$/, '')
}

/**
 * The single label of a direct platform subdomain (`<label>.<PLATFORM_HOST>`),
 * or null for the apex, a deeper name, or a non-platform host. The apex and
 * www/api are already excluded by PLATFORM_HOSTS before this is used.
 */
function platformSubdomainLabel(host: string): string | null {
  const suffix = `.${PLATFORM_HOST}`
  if (!host.endsWith(suffix)) return null
  const label = host.slice(0, -suffix.length)
  if (label === '' || label.includes('.')) return null
  return label
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

  // A store's canonical URL is its subdomain, so a hit on the apex
  // /store/<slug> is permanently redirected to <slug>.<PLATFORM_HOST>.
  // The seller store-preview iframe loads /store/<slug>?preview=true on the
  // apex, so preview requests are left untouched.
  if (
    (host === PLATFORM_HOST || host === `www.${PLATFORM_HOST}`) &&
    request.nextUrl.searchParams.get('preview') !== 'true'
  ) {
    const storeMatch = pathname.match(/^(\/(?:en|hy|ru))?\/store\/([^/]+)(\/.*)?$/)
    if (storeMatch) {
      const [, localeSeg = '', slug, rest = ''] = storeMatch
      const target = request.nextUrl.clone()
      target.protocol = 'https:'
      target.host = `${slug}.${PLATFORM_HOST}`
      target.port = ''
      target.pathname = `${localeSeg}${rest}` || '/'
      return NextResponse.redirect(target, 301)
    }
  }

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
    } else if (!pathname.startsWith('/store/')) {
      // A `<slug>.yerevan.digital` address with no active store: rewrite into
      // the storefront route so its /info lookup 404s and the not-found
      // boundary renders the "store unavailable" page. The attempted host is
      // forwarded so that page can show it.
      const label = platformSubdomainLabel(host)
      if (label) {
        const url = request.nextUrl.clone()
        url.pathname = `/store/${label}`

        const headers = new Headers(request.headers)
        headers.set('x-store-host', host)

        return NextResponse.rewrite(url, { request: { headers } })
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

  const token = request.cookies.get('yerevan_digital_token')?.value
  const role = request.cookies.get('yerevan_digital_role')?.value

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
