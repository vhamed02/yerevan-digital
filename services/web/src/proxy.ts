import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_PATHS = ['/admin']
const SELLER_PATHS = ['/seller']
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password']
const LOCALES = ['hy', 'en']
const DEFAULT_LOCALE = 'hy'

function resolveLocale(request: NextRequest): string {
  const cookie = request.cookies.get('NEXT_LOCALE')?.value
  if (cookie && LOCALES.includes(cookie)) return cookie
  const accept = request.headers.get('accept-language') ?? ''
  return accept.toLowerCase().includes('hy') ? 'hy' : DEFAULT_LOCALE
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get('vendora_token')?.value
  const role = request.cookies.get('vendora_role')?.value

  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p))
  const isSellerPath = SELLER_PATHS.some((p) => pathname.startsWith(p))
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p))

  if (isAdminPath && (!token || role !== 'super-admin')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (isSellerPath && (!token || role !== 'seller')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (isAuthPath && token) {
    return NextResponse.redirect(new URL(role === 'super-admin' ? '/admin' : '/seller', request.url))
  }

  const locale = resolveLocale(request)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('X-NEXT-INTL-LOCALE', locale)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next|_vercel|api|.*\\..*).*)'],
}
