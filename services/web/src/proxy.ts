import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_PATHS = ['/admin']
const SELLER_PATHS = ['/seller']
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get('vendora_token')?.value
  const role = request.cookies.get('vendora_role')?.value

  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p))
  const isSellerPath = SELLER_PATHS.some((p) => pathname.startsWith(p))
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p))

  if (isAdminPath) {
    if (!token || role !== 'super-admin') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  if (isSellerPath) {
    if (!token || role !== 'seller') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  if (isAuthPath && token) {
    const destination = role === 'super-admin' ? '/admin' : '/seller'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/seller/:path*', '/auth/:path*'],
}
