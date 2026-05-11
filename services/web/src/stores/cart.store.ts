'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, Product, Variant } from '@/types'

interface CartState {
  items: CartItem[]
  storeSlug: string | null
  addItem: (product: Product, variant?: Variant, quantity?: number) => void
  removeItem: (productId: string, variantId?: number) => void
  updateQuantity: (productId: string, variantId: number | undefined, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      storeSlug: null,

      addItem: (product, variant, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === product.uuid && i.variantId === variant?.id
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.uuid && i.variantId === variant?.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            }
          }
          const price = product.price + (variant?.price_modifier ?? 0)
          return {
            items: [
              ...state.items,
              {
                productId: product.uuid,
                productName: product.name,
                productSlug: product.slug,
                variantId: variant?.id,
                variantName: variant ? `${variant.name}: ${variant.value}` : undefined,
                price,
                quantity,
                image: product.images[0]?.thumbnail,
              },
            ],
          }
        })
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        }))
      },

      updateQuantity: (productId, variantId: number | undefined, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [], storeSlug: null }),

      getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'vendora-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export default useCartStore
