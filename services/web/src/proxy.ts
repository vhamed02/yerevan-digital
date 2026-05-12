import { NextResponse, type NextRequest } from 'next/server'

const LOCALES = ['en', 'hy']
const DEFAULT_LOCALE = 'hy'

const ADMIN_PATHS = ['/admin']
const SELLER_PATHS = ['/seller']
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password']

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Detect locale prefix in URL and rewrite to bare path
  const localeMatch = pathname.match(/^\/(en|hy)(\/|$)/)
  const locale = localeMatch ? localeMatch[1] : DEFAULT_LOCALE
  const bare = localeMatch ? pathname.slice(localeMatch[0].length - (localeMatch[2] === '/' ? 0 : 0)).replace(/^\/(en|hy)/, '') || '/' : pathname

  const token = request.cookies.get('vendora_token')?.value
  const role = request.cookies.get('vendora_role')?.value

  if (ADMIN_PATHS.some((p) => bare.startsWith(p)) && (!token || role !== 'super-admin')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (SELLER_PATHS.some((p) => bare.startsWith(p)) && (!token || role !== 'seller')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (AUTH_PATHS.some((p) => bare.startsWith(p)) && token) {
    return NextResponse.redirect(new URL(role === 'super-admin' ? '/admin' : '/seller', request.url))
  }

  // Rewrite locale-prefixed URL to bare path, passing locale via header
  const headers = new Headers(request.headers)
  headers.set('X-NEXT-INTL-LOCALE', locale)

  if (localeMatch) {
    const url = request.nextUrl.clone()
    url.pathname = bare
    return NextResponse.rewrite(url, { request: { headers } })
  }

  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/((?!_next|_vercel|api|.*\\..*).*)'],
}
