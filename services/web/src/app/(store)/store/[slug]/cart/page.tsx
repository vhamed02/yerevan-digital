'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { Minus, Plus, X, ShoppingBag } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useStoreCart } from '@/stores/cart.store'

export default function CartPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const { slug } = useParams<{ slug: string }>()
  const { items: storeItems, removeItem, updateQuantity, getTotal } = useStoreCart(slug)
  const items = mounted ? storeItems : []
  const total = mounted ? getTotal() : 0

  if (!mounted || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <ShoppingBag className="mb-4 h-16 w-16 text-gray-200" />
        <h1 className="mb-2 text-xl font-bold text-gray-900">Ձեր զամբյուղը դատարկ է</h1>
        <p className="mb-6 text-gray-500">Ավելացրեք ապրանքներ սկսելու համար։</p>
        <Link
          href={`/store/${slug}/products`}
          className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          Դիտել ապրանքները
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Գնումների զամբյուղ</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <ul className="flex flex-col divide-y divide-gray-100">
            {items.map((item) => (
              <li
                key={`${item.productId}:${item.variantId ?? ''}`}
                className="flex gap-4 py-5"
              >
                <Link href={`/store/${slug}/products/${item.productSlug}`}>
                  {item.image ? (
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100">
                      <Image src={item.image} alt={item.productName} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-gray-100" />
                  )}
                </Link>

                <div className="flex flex-1 flex-col justify-between gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/store/${slug}/products/${item.productSlug}`}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {item.productName}
                      </Link>
                      {item.variantName && (
                        <p className="text-sm text-gray-500">{item.variantName}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                      aria-label="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-gray-200">
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-50"
                        aria-label="Decrease"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-50"
                        aria-label="Increase"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {(item.price * item.quantity).toLocaleString()} ֏
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <h2 className="mb-4 font-bold text-gray-900">Պատվերի ամփոփում</h2>
            <div className="mb-1 flex items-center justify-between text-sm text-gray-600">
              <span>Ենթամիջ</span>
              <span>{total.toLocaleString()} ֏</span>
            </div>
            <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
              <span>Առաքում</span>
              <span className="text-green-600">Անվճար</span>
            </div>
            <div className="mb-5 flex items-center justify-between border-t border-gray-200 pt-4 font-bold text-gray-900">
              <span>Ընդամենը</span>
              <span>{total.toLocaleString()} ֏</span>
            </div>
            <Link
              href={`/store/${slug}/checkout`}
              className="flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
            >
              Անցնել վճարման →
            </Link>
            <Link
              href={`/store/${slug}/products`}
              className="mt-3 flex w-full items-center justify-center text-sm text-gray-500 hover:text-gray-700"
            >
              Շարունակել գնումները
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
