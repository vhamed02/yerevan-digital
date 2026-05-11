'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Check, ArrowRight } from 'lucide-react'
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
    <Link href={`/store/${storeSlug}/products/${product.slug}`} className="group block">
      <div className="overflow-hidden rounded-none border-2 border-gray-900 bg-white transition-all group-hover:shadow-[6px_6px_0_#111]">
        <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '3/4' }}>
          {image ? (
            <Image
              src={image.medium}
              alt={name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <ShoppingBag className="h-16 w-16" />
            </div>
          )}
          {product.compare_price && product.compare_price > product.price && (
            <span className="absolute left-0 top-3 bg-red-500 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white tracking-widest">
              Sale
            </span>
          )}
        </div>
        <div className="border-t-2 border-gray-900 p-3">
          <p className="text-xs font-extrabold uppercase tracking-widest text-gray-900 line-clamp-1">{name}</p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">{product.price.toLocaleString()} ֏</span>
            <button
              onClick={handleAdd}
              className={`flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-extrabold uppercase transition-colors ${
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-900 text-white hover:bg-gray-700'
              }`}
            >
              {added ? <Check className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
              {added ? 'Added' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
