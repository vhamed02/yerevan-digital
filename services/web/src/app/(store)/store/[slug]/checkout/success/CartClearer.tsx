'use client'

import { useEffect } from 'react'
import { useStoreCart } from '@/stores/cart.store'

export function CartClearer({ storeSlug }: { storeSlug: string }) {
  const { clearCart } = useStoreCart(storeSlug)
  useEffect(() => {
    clearCart()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
