import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

const ADMIN_PATHS = ['/admin']
const SELLER_PATHS = ['/seller']
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password']

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|hy)/, '') || '/'
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const bare = stripLocale(pathname)

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

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!_next|_vercel|api|.*\\..*).*)'],
}
