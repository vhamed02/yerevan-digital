import createMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'
import { routing } from './i18n/routing'
import { proxy } from './proxy'

const intlMiddleware = createMiddleware(routing)

export default function middleware(request: NextRequest) {
  const proxyResponse = proxy(request)
  if (proxyResponse && proxyResponse.status !== 200) return proxyResponse

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!_next|_vercel|api|.*\\..*).*)'],
}
