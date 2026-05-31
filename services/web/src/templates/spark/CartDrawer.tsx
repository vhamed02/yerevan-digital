'use client'

import { useState, useEffect } from 'react'
import { X, Minus, Plus, ShoppingBag, ArrowRight, Gift } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useStoreCart } from '@/stores/cart.store'
import type { CartDrawerProps } from '../types'

const FREE_SHIPPING_THRESHOLD = 10000

export function CartDrawer({ open, onClose, storeSlug }: CartDrawerProps) {
  const [mounted, setMounted] = useState(false)
  const t = useTranslations('storefront')
  useEffect(() => { setMounted(true) }, [])

  const { items: storeItems, removeItem, updateQuantity, getTotal, getItemCount } = useStoreCart(storeSlug)
  const items = mounted ? storeItems : []
  const total = mounted ? getTotal() : 0
  const count = mounted ? getItemCount() : 0

  const toFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const freeShippingProgress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100)
  const hasFreeShipping = total >= FREE_SHIPPING_THRESHOLD

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      </div>

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[380px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-gray-800" />
            <span className="font-bold text-gray-900">{t('cart.title')}</span>
            {count > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: 'var(--accent)' }}>
                {count}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Free shipping bar */}
        {count > 0 && (
          <div className="border-b border-gray-100 px-5 py-3">
            {hasFreeShipping ? (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                <Gift className="h-3.5 w-3.5" />
                {t('cart.freeShippingUnlocked')}
              </div>
            ) : (
              <p className="mb-2 text-xs text-gray-500">
                {t.rich('cart.addMoreForFreeShipping', {
                  amount: `${toFreeShipping.toLocaleString()} ֏`,
                  b: (chunks) => <span className="font-semibold text-gray-800">{chunks}</span>,
                })}
              </p>
            )}
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${freeShippingProgress}%`, backgroundColor: hasFreeShipping ? '#10b981' : 'var(--accent)' }}
              />
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-50">
              <ShoppingBag className="h-8 w-8 text-gray-300" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{t('cart.empty')}</p>
              <p className="mt-1 text-sm text-gray-400">{t('cart.emptyHint')}</p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {t('cart.continueShopping')} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="flex flex-col gap-5">
                {items.map((item) => (
                  <li key={`${item.productId}:${item.variantId ?? ''}`} className="flex gap-3.5">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50">
                      {item.image ? (
                        <Image src={item.image} alt={item.productName} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-7 w-7 text-gray-200" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug text-gray-900 line-clamp-2">{item.productName}</p>
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="flex-shrink-0 rounded-lg p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600"
                          aria-label="Remove item"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {item.variantName && (
                        <p className="text-xs text-gray-400">{item.variantName}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center rounded-xl border border-gray-200">
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center text-gray-500 hover:text-gray-900"
                            aria-label="Decrease"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                            className="flex h-7 w-7 items-center justify-center text-gray-500 hover:text-gray-900"
                            aria-label="Increase"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {(item.price * item.quantity).toLocaleString()} ֏
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-gray-100 px-5 py-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">{t('cart.total')}</span>
                <span className="text-xl font-black text-gray-900">{total.toLocaleString()} ֏</span>
              </div>
              <Link
                href={`/store/${storeSlug}/checkout`}
                onClick={onClose}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all hover:opacity-90 hover:shadow-xl"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {t('cart.checkout')} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/store/${storeSlug}/cart`}
                onClick={onClose}
                className="mt-2.5 flex w-full items-center justify-center rounded-2xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                {t('cart.viewCart')}
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}
