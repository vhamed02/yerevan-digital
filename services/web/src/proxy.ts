import { NextResponse, type NextRequest } from 'next/server'

const LOCALES = ['en', 'hy', 'ru'] as const
type Locale = (typeof LOCALES)[number]
const DEFAULT_LOCALE: Locale = 'hy'

const ADMIN_PATHS = ['/admin']
const SELLER_PATHS = ['/seller']
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

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
