import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'zustand/vanilla'
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

function makeCart() {
  return createStore<CartState>()((set, get) => ({
    items: [],

    addItem: (product, variant, quantity = 1) =>
      set((state) => {
        const match = (i: CartItem) =>
          i.productId === product.uuid && i.variantId === variant?.id
        const existing = state.items.find(match)
        if (existing) {
          return { items: state.items.map((i) => match(i) ? { ...i, quantity: i.quantity + quantity } : i) }
        }
        const price = variant ? variant.price : product.price
        return {
          items: [
            ...state.items,
            {
              productId:   product.uuid,
              productName: product.name.hy || product.name.en,
              productSlug: product.slug,
              variantId:   variant?.id,
              price,
              quantity,
              image:       product.images[0]?.thumbnail,
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
          i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i
        ),
      }))
    },

    clearCart: () => set({ items: [] }),

    getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

    getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  }))
}

const mockProduct: StorefrontProduct = {
  uuid:         'prod-uuid-1',
  name:         { hy: 'Ապрranq', en: 'Product' },
  slug:         'product-1',
  price:        5000,
  status:       'active',
  is_featured:  false,
  stock:        10,
  manage_stock: true,
  images:       [{ uuid: 'img-1', thumbnail: '/thumb.jpg', medium: '/med.jpg', original: '/orig.jpg', large: '/large.jpg' }],
}

const mockProduct2: StorefrontProduct = {
  uuid:         'prod-uuid-2',
  name:         { hy: 'Ап2', en: 'Product 2' },
  slug:         'product-2',
  price:        3000,
  status:       'active',
  is_featured:  false,
  stock:        5,
  manage_stock: true,
  images:       [],
}

describe('cart.store', () => {
  let store: ReturnType<typeof makeCart>

  beforeEach(() => {
    store = makeCart()
  })

  it('starts with empty cart', () => {
    expect(store.getState().items).toHaveLength(0)
    expect(store.getState().getTotal()).toBe(0)
  })

  it('addItem adds a new item', () => {
    store.getState().addItem(mockProduct, undefined, 1)
    const { items } = store.getState()
    expect(items).toHaveLength(1)
    expect(items[0].productId).toBe('prod-uuid-1')
    expect(items[0].quantity).toBe(1)
    expect(items[0].price).toBe(5000)
  })

  it('addItem increments quantity for existing item', () => {
    store.getState().addItem(mockProduct, undefined, 2)
    store.getState().addItem(mockProduct, undefined, 3)
    expect(store.getState().items).toHaveLength(1)
    expect(store.getState().items[0].quantity).toBe(5)
  })

  it('addItem adds separate entries for different products', () => {
    store.getState().addItem(mockProduct, undefined, 1)
    store.getState().addItem(mockProduct2, undefined, 1)
    expect(store.getState().items).toHaveLength(2)
  })

  it('removeItem removes the correct item', () => {
    store.getState().addItem(mockProduct, undefined, 1)
    store.getState().addItem(mockProduct2, undefined, 1)
    store.getState().removeItem('prod-uuid-1', undefined)
    const { items } = store.getState()
    expect(items).toHaveLength(1)
    expect(items[0].productId).toBe('prod-uuid-2')
  })

  it('updateQuantity changes the quantity', () => {
    store.getState().addItem(mockProduct, undefined, 1)
    store.getState().updateQuantity('prod-uuid-1', undefined, 4)
    expect(store.getState().items[0].quantity).toBe(4)
  })

  it('updateQuantity with 0 removes the item', () => {
    store.getState().addItem(mockProduct, undefined, 2)
    store.getState().updateQuantity('prod-uuid-1', undefined, 0)
    expect(store.getState().items).toHaveLength(0)
  })

  it('getTotal calculates correct sum', () => {
    store.getState().addItem(mockProduct, undefined, 2)
    store.getState().addItem(mockProduct2, undefined, 1)
    expect(store.getState().getTotal()).toBe(5000 * 2 + 3000 * 1)
  })

  it('clearCart empties all items', () => {
    store.getState().addItem(mockProduct, undefined, 3)
    store.getState().clearCart()
    expect(store.getState().items).toHaveLength(0)
    expect(store.getState().getTotal()).toBe(0)
  })
})
