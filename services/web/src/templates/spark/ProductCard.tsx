'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Check } from 'lucide-react'
import { useStoreCart } from '@/stores/cart.store'
import type { ProductCardProps } from '../types'

export function ProductCard({ product, storeSlug, isPreview }: ProductCardProps) {
  const [added, setAdded] = useState(false)
  const { addItem } = useStoreCart(storeSlug)
  const name = product.name.hy || product.name.en
  const image = product.images?.[0]
  const isOnSale = product.compare_price && product.compare_price > product.price
  const inStock = !product.manage_stock || product.stock > 0

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault()
    if (isPreview || !inStock) return
    addItem(product, undefined, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <Link href={`/store/${storeSlug}/products/${product.slug}`} className="group block">
      <div className="overflow-hidden rounded-2xl bg-white transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl shadow-sm ring-1 ring-black/5">

        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
          {image ? (
            <Image
              src={image.medium}
              alt={name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-200">
              <ShoppingBag className="h-14 w-14" />
            </div>
          )}

          {/* Overlay with quick-add */}
          <div className="absolute inset-0 flex items-end justify-center p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              onClick={handleQuickAdd}
              className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold shadow-lg backdrop-blur-sm transition-colors ${
                added
                  ? 'bg-green-500 text-white'
                  : !inStock
                  ? 'cursor-not-allowed bg-white/80 text-gray-400'
                  : 'bg-white/90 text-gray-900 hover:bg-[var(--accent)] hover:text-white'
              }`}
            >
              {added ? (
                <><Check className="h-3.5 w-3.5" /> Ավելացվեց</>
              ) : !inStock ? (
                'Ոչ առկա'
              ) : (
                <><ShoppingBag className="h-3.5 w-3.5" /> Ավելացնել</>
              )}
            </button>
          </div>

          {/* Badges */}
          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1">
            {isOnSale && (
              <span className="rounded-lg bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                SALE
              </span>
            )}
            {!inStock && (
              <span className="rounded-lg bg-gray-900/70 px-2 py-0.5 text-[10px] font-bold text-white">
                Ոչ առկա
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900">{name}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-gray-900">
              {product.price.toLocaleString()} ֏
            </span>
            {isOnSale && (
              <span className="text-xs text-gray-400 line-through">
                {product.compare_price!.toLocaleString()} ֏
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
