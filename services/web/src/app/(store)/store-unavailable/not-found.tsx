import { headers } from 'next/headers'
import { StoreUnavailable } from '@/components/store/StoreUnavailable'

/**
 * 404 body for an unmapped store subdomain. The attempted address is forwarded
 * by the proxy in the `x-store-host` header.
 */
export default async function StoreUnavailableNotFound() {
  const host = (await headers()).get('x-store-host') ?? undefined
  return <StoreUnavailable host={host} />
}
