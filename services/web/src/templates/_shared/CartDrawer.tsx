'use client'

import { useState, useEffect } from 'react'
import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useStoreCart } from '@/stores/cart.store'
import type { CartDrawerProps } from '../types'

export function CartDrawer({ open, onClose, storeSlug }: CartDrawerProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const { items: storeItems, removeItem, updateQuantity, getTotal, getItemCount } = useStoreCart(storeSlug)
  const items = mounted ? storeItems : []
  const total = mounted ? getTotal() : 0
  const count = mounted ? getItemCount() : 0

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gray-700" />
            <span className="font-semibold text-gray-900">Cart ({count})</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6">
            <ShoppingBag className="h-16 w-16 text-gray-200" />
            <p className="text-gray-500">Your cart is empty</p>
            <button
              onClick={onClose}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="flex flex-col gap-4">
                {items.map((item) => (
                  <li key={`${item.productId}:${item.variantId ?? ''}`} className="flex gap-3">
                    {item.image ? (
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-100">
                        <Image src={item.image} alt={item.productName} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="h-16 w-16 flex-shrink-0 rounded-md bg-gray-100" />
                    )}
                    <div className="flex flex-1 flex-col gap-1">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-xs text-gray-500">{item.variantName}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 rounded-md border border-gray-200">
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                            className="px-2 py-1 text-gray-600 hover:bg-gray-50"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                            className="px-2 py-1 text-gray-600 hover:bg-gray-50"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {(item.price * item.quantity).toLocaleString()} ֏
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="self-start p-1 text-gray-400 hover:text-gray-600"
                      aria-label="Remove item"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-gray-100 px-5 py-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-gray-600">Total</span>
                <span className="text-lg font-bold text-gray-900">{total.toLocaleString()} ֏</span>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/store/${storeSlug}/checkout`}
                  onClick={onClose}
                  className="flex items-center justify-center rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                >
                  Checkout →
                </Link>
                <Link
                  href={`/store/${storeSlug}/cart`}
                  onClick={onClose}
                  className="flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View Cart
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
