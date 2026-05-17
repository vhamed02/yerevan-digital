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

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault()
    if (isPreview) return
    addItem(product, undefined, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <Link href={`/store/${storeSlug}/products/${product.slug}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow group-hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {image ? (
            <Image
              src={image.medium}
              alt={name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-200">
              <ShoppingBag className="h-12 w-12" />
            </div>
          )}
          <div className="absolute inset-0 flex items-end justify-center bg-black/0 p-3 opacity-0 transition-all duration-200 group-hover:bg-black/5 group-hover:opacity-100">
            <button
              onClick={handleQuickAdd}
              className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold shadow-lg transition-colors ${
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-900 hover:text-white'
              }`}
            >
              {added ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Ավելացվեց
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3.5 w-3.5" /> Ավելացնել
                </>
              )}
            </button>
          </div>
          {product.compare_price && product.compare_price > product.price && (
            <span className="absolute left-2 top-2 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              SALE
            </span>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-medium text-gray-900 line-clamp-2">{name}</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-sm font-bold text-gray-900">{product.price.toLocaleString()} ֏</span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-xs text-gray-400 line-through">
                {product.compare_price.toLocaleString()} ֏
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
