/**
 * Public URL of a storefront.
 *
 * Every store is served for free at `<slug>.yerevan.digital` (the platform
 * subdomain). A store that has claimed and verified its own domain is served
 * there instead. This is the single source of truth for storefront URLs shown
 * anywhere in the app — links, share buttons, SEO canonical/OG tags.
 */

/** The platform host, e.g. `yerevan.digital`. Derived from env so non-prod
 *  environments (staging, local) build the right subdomains. */
export const PLATFORM_HOST =
  process.env.NEXT_PUBLIC_PLATFORM_HOST ||
  process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '').split('/')[0] ||
  'yerevan.digital'

export interface StoreUrlInput {
  slug: string
  custom_domain?: string | null
  custom_domain_verified_at?: string | null
}

/** Origin (scheme + host) the store is served on. */
export function storeOrigin(store: StoreUrlInput): string {
  if (store.custom_domain && store.custom_domain_verified_at) {
    return `https://${store.custom_domain}`
  }

  return `https://${store.slug}.${PLATFORM_HOST}`
}

/** Full public URL for a store, with an optional sub-path such as `/products`. */
export function storeUrl(store: StoreUrlInput, path = ''): string {
  return storeOrigin(store) + path
}
