'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Check, Heart, Eye } from 'lucide-react'
import { useStoreCart } from '@/stores/cart.store'
import type { ProductCardProps } from '../types'

export function ProductCard({ product, storeSlug, isPreview }: ProductCardProps) {
  const [added, setAdded] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const { addItem } = useStoreCart(storeSlug)

  const name = product.name.hy || product.name.en
  const image = product.images?.[0]
  const hoverImage = product.images?.[1]
  const isOnSale = product.compare_price && product.compare_price > product.price
  const inStock = !product.manage_stock || product.stock > 0
  const discountPct = isOnSale
    ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
    : 0

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault()
    if (isPreview || !inStock) return
    addItem(product, undefined, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    setWishlisted((v) => !v)
  }

  return (
    <Link href={`/store/${storeSlug}/products/${product.slug}`} className="group flex h-full flex-col">
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04] transition-all duration-300 group-hover:shadow-lg group-hover:ring-black/[0.08]">

        {/* Image container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
          {image ? (
            <>
              <Image
                src={image.medium}
                alt={name}
                fill
                className={`object-cover transition-all duration-500 ${hoverImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
              />
              {hoverImage && (
                <Image
                  src={hoverImage.medium}
                  alt={name}
                  fill
                  className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-gray-200" />
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-200 hover:scale-110 ${
              isPreview ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
            }`}
            aria-label="Wishlist"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
            />
          </button>

          {/* Quick add */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full p-3 transition-transform duration-300 group-hover:translate-y-0">
            <button
              onClick={handleQuickAdd}
              className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold shadow-lg backdrop-blur-sm transition-colors ${
                added
                  ? 'bg-emerald-500 text-white'
                  : !inStock
                  ? 'cursor-not-allowed bg-white/80 text-gray-400'
                  : 'bg-gray-900 text-white hover:bg-[var(--accent)]'
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
          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
            {isOnSale && discountPct > 0 && (
              <span className="rounded-lg px-2 py-0.5 text-[10px] font-black text-white shadow-sm" style={{ backgroundColor: 'var(--accent)' }}>
                −{discountPct}%
              </span>
            )}
            {!inStock && (
              <span className="rounded-lg bg-gray-900/80 px-2 py-0.5 text-[10px] font-bold text-white">
                Ոչ առկա
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col p-4">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 group-hover:text-[var(--accent)] transition-colors">
            {name}
          </p>
          <div className="mt-auto pt-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-gray-900">
                {product.price.toLocaleString()} ֏
              </span>
              {isOnSale && (
                <span className="text-xs font-medium text-gray-400 line-through">
                  {product.compare_price!.toLocaleString()} ֏
                </span>
              )}
            </div>
            {product.view_count > 0 && (
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-400">
                <Eye className="h-3 w-3" />
                <span>{product.view_count.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
