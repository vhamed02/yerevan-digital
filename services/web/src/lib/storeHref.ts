/**
 * Build a storefront navigation URL from a base path and an in-store path.
 *
 * On a store domain (`<slug>.yerevan.digital` or a verified custom domain) the
 * base is `''`, so links are root-relative (`/products`). On the platform path
 * — e.g. the seller's store preview — the base is `/store/<slug>`, keeping those
 * links working there too. Pair with `useStoreBase()` (client) or the
 * `x-store-domain` header (server) to obtain the base.
 */
export function storeHref(base: string, path = ''): string {
  if (!path) return base || '/'
  const p = path.startsWith('/') || path.startsWith('?') ? path : `/${path}`
  return `${base}${p}`
}
