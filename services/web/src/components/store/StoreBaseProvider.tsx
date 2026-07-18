'use client'

import { createContext, useContext } from 'react'

export { storeHref } from '@/lib/storeHref'

/**
 * The storefront base path for the current request: `''` when served on a store
 * domain, `/store/<slug>` on the platform path. Provided once at the store root
 * and read by client components to build root-relative navigation links.
 */
const StoreBaseContext = createContext('')

export function StoreBaseProvider({
  base,
  children,
}: {
  base: string
  children: React.ReactNode
}) {
  return <StoreBaseContext.Provider value={base}>{children}</StoreBaseContext.Provider>
}

export function useStoreBase(): string {
  return useContext(StoreBaseContext)
}
