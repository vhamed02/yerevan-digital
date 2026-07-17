'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, StorefrontProduct, StorefrontVariant } from '@/types'

interface CartState {
  items: CartItem[]
  addItem: (product: StorefrontProduct, variant?: StorefrontVariant, quantity?: number) => void
  removeItem: (productId: string, variantId?: number) => void
  updateQuantity: (productId: string, variantId: number | undefined, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

const safeStorage = {
  getItem: (name: string) =>
    typeof window !== 'undefined' ? localStorage.getItem(name) : null,
  setItem: (name: string, value: string) => {
    if (typeof window !== 'undefined') localStorage.setItem(name, value)
  },
  removeItem: (name: string) => {
    if (typeof window !== 'undefined') localStorage.removeItem(name)
  },
}

const cartInstances = new Map<string, () => CartState>()

function buildCartStore(storeSlug: string) {
  return create<CartState>()(
    persist(
      (set, get) => ({
        items: [],

        addItem: (product, variant, quantity = 1) =>
          set((state) => {
            const match = (i: CartItem) =>
              i.productId === product.uuid && i.variantId === variant?.id
            const existing = state.items.find(match)
            if (existing) {
              return {
                items: state.items.map((i) =>
                  match(i) ? { ...i, quantity: i.quantity + quantity } : i
                ),
              }
            }
            const price = variant ? variant.price : product.price
            const variantName = variant
              ? Object.entries(variant.attributes)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(', ')
              : undefined
            return {
              items: [
                ...state.items,
                {
                  productId: product.uuid,
                  productName: product.name.hy || product.name.en,
                  productSlug: product.slug,
                  variantId: variant?.id,
                  variantName,
                  price,
                  quantity,
                  image: product.images?.[0]?.thumbnail,
                },
              ],
            }
          }),

        removeItem: (productId, variantId) =>
          set((state) => ({
            items: state.items.filter(
              (i) => !(i.productId === productId && i.variantId === variantId)
            ),
          })),

        updateQuantity: (productId, variantId, quantity) => {
          if (quantity <= 0) {
            get().removeItem(productId, variantId)
            return
          }
          set((state) => ({
            items: state.items.map((i) =>
              i.productId === productId && i.variantId === variantId
                ? { ...i, quantity }
                : i
            ),
          }))
        },

        clearCart: () => set({ items: [] }),

        getTotal: () =>
          get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

        getItemCount: () =>
          get().items.reduce((sum, i) => sum + i.quantity, 0),
      }),
      {
        name: `yerevan_digital_cart_${storeSlug}`,
        storage: createJSONStorage(() => safeStorage),
      }
    )
  )
}

export function useStoreCart(storeSlug: string): CartState {
  if (!cartInstances.has(storeSlug)) {
    cartInstances.set(storeSlug, buildCartStore(storeSlug))
  }
  return cartInstances.get(storeSlug)!()
}
