'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Plus, Minus, Check, ChevronRight } from 'lucide-react'
import { useStoreCart } from '@/stores/cart.store'
import type { ProductDetailProps, StorefrontVariant } from '../types'

export function ProductDetail({ product, storeSlug, isPreview }: ProductDetailProps) {
  const activeVariants = product.variants?.filter((v) => v.is_active) ?? []
  const [selectedVariant, setSelectedVariant] = useState<StorefrontVariant | null>(
    activeVariants[0] ?? null
  )
  const [quantity, setQuantity] = useState(1)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [added, setAdded] = useState(false)

  const { addItem } = useStoreCart(storeSlug)

  const price = selectedVariant ? selectedVariant.price : product.price
  const inStock = selectedVariant
    ? !product.manage_stock || selectedVariant.stock > 0
    : !product.manage_stock || product.stock > 0

  const attributeKeys = activeVariants.length
    ? [...new Set(activeVariants.flatMap((v) => Object.keys(v.attributes)))]
    : []

  function handleAddToCart() {
    if (isPreview || !inStock) return
    addItem(product, selectedVariant ?? undefined, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const name = product.name.hy || product.name.en
  const descFull = product.description_full?.hy || product.description_full?.en

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-gray-500">
        <Link href={`/store/${storeSlug}`} className="hover:text-gray-700">Գլխավոր</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/store/${storeSlug}/products`} className="hover:text-gray-700">Ապրանքներ</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900">{name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
            {product.images?.[activeImageIdx] ? (
              <Image
                src={product.images[activeImageIdx].large}
                alt={name}
                fill
                className="object-contain"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-300">
                <ShoppingBag className="h-20 w-20" />
              </div>
            )}
          </div>
          {(product.images?.length ?? 0) > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images?.map((img, i) => (
                <button
                  key={img.uuid}
                  onClick={() => setActiveImageIdx(i)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    activeImageIdx === i ? 'border-gray-900' : 'border-gray-100 hover:border-gray-300'
                  }`}
                  aria-label={`Image ${i + 1}`}
                >
                  <Image src={img.thumbnail} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            {product.description_short && (
              <p className="mt-2 text-gray-600">
                {product.description_short.hy || product.description_short.en}
              </p>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">{price.toLocaleString()} ֏</span>
            {product.compare_price && product.compare_price > price && (
              <span className="text-lg text-gray-400 line-through">
                {product.compare_price.toLocaleString()} ֏
              </span>
            )}
          </div>

          {!inStock && (
            <span className="inline-flex w-fit rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-600">
              Ապրանքն առկա չէ
            </span>
          )}

          {attributeKeys.length > 0 && (
            <div className="flex flex-col gap-4">
              {attributeKeys.map((key) => {
                const values = [...new Set(activeVariants.map((v) => v.attributes[key]).filter(Boolean))]
                return (
                  <div key={key}>
                    <p className="mb-2 text-sm font-semibold text-gray-700">{key}</p>
                    <div className="flex flex-wrap gap-2">
                      {values.map((val) => {
                        const variant = activeVariants.find((v) => v.attributes[key] === val)
                        const isSelected =
                          selectedVariant?.attributes[key] === val
                        return (
                          <button
                            key={val}
                            onClick={() => variant && setSelectedVariant(variant)}
                            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                              isSelected
                                ? 'border-gray-900 bg-gray-900 text-white'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {val}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-gray-200">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-2.5 text-gray-600 hover:bg-gray-50"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="px-3 py-2.5 text-gray-600 hover:bg-gray-50"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!inStock || isPreview}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-all ${
                added
                  ? 'bg-green-600 text-white'
                  : inStock && !isPreview
                  ? 'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700'
                  : 'cursor-not-allowed bg-gray-100 text-gray-400'
              }`}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" /> Ավելացվեց
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  {inStock ? 'Ավելացնել' : 'Ոչ առկա'}
                </>
              )}
            </button>
          </div>

          {descFull && (
            <div className="border-t border-gray-100 pt-5">
              <p className="mb-2 text-sm font-semibold text-gray-700">Նկարագրություն</p>
              <div
                className="prose prose-sm max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: descFull }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
