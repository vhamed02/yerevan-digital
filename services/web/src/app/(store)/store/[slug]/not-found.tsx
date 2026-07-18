import { headers } from 'next/headers'
import { StoreUnavailable } from '@/components/store/StoreUnavailable'

/**
 * Storefront 404. Reached when a store's `/info` lookup fails — including an
 * unmapped `<slug>.yerevan.digital` subdomain, which the proxy rewrites here
 * with the attempted address in the `x-store-host` header.
 */
export default async function StoreNotFound() {
  const host = (await headers()).get('x-store-host') ?? undefined
  return <StoreUnavailable host={host} />
}
