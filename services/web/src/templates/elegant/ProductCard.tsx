'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useStoreCart } from '@/stores/cart.store'
import type { ProductCardProps } from '../types'

export function ProductCard({ product, storeSlug, isPreview }: ProductCardProps) {
  const [added, setAdded] = useState(false)
  const { addItem } = useStoreCart(storeSlug)
  const name = product.name.hy || product.name.en
  const image = product.images[0]

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    if (isPreview) return
    addItem(product, undefined, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <Link href={`/store/${storeSlug}/products/${product.slug}`} className="group block text-center">
      <div className="relative overflow-hidden bg-stone-100" style={{ aspectRatio: '2/3' }}>
        {image ? (
          <Image
            src={image.medium}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-200">
            <span className="text-5xl">🛍</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <p
          className="text-sm font-semibold text-stone-800 group-hover:underline underline-offset-2 line-clamp-1"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {name}
        </p>
        <div className="mt-1 flex items-baseline justify-center gap-2">
          <span className="text-sm text-stone-700">{product.price.toLocaleString()} ֏</span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-xs text-stone-400 line-through">
              {product.compare_price.toLocaleString()} ֏
            </span>
          )}
        </div>
        <button
          onClick={handleAdd}
          className="mt-2 text-xs font-semibold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors"
        >
          {added ? '✓ Added' : '+ Add to Bag'}
        </button>
      </div>
    </Link>
  )
}
