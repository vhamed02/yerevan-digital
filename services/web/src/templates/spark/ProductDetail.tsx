'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Plus, Minus, Check, ChevronRight, ShieldCheck, RefreshCw, Truck, Star } from 'lucide-react'
import { useStoreCart } from '@/stores/cart.store'
import ReviewSection from '@/components/store/ReviewSection'
import type { ProductDetailProps, StorefrontVariant } from '../types'

type Tab = 'description' | 'details'

export function ProductDetail({ product, storeSlug, isPreview }: ProductDetailProps) {
  const activeVariants = product.variants?.filter((v) => v.is_active) ?? []
  const [selectedVariant, setSelectedVariant] = useState<StorefrontVariant | null>(activeVariants[0] ?? null)
  const [quantity, setQuantity] = useState(1)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [added, setAdded] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('description')

  const { addItem } = useStoreCart(storeSlug)

  const price = selectedVariant ? selectedVariant.price : product.price
  const inStock = selectedVariant
    ? !product.manage_stock || selectedVariant.stock > 0
    : !product.manage_stock || product.stock > 0

  const isOnSale = product.compare_price && product.compare_price > price
  const savingsPct = isOnSale
    ? Math.round(((product.compare_price! - price) / product.compare_price!) * 100)
    : 0

  const attributeKeys = activeVariants.length
    ? [...new Set(activeVariants.flatMap((v) => Object.keys(v.attributes)))]
    : []

  function handleAddToCart() {
    if (isPreview || !inStock) return
    addItem(product, selectedVariant ?? undefined, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  const name = product.name.hy || product.name.en
  const descFull = product.description_full?.hy || product.description_full?.en
  const descShort = product.description_short?.hy || product.description_short?.en

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1.5 text-sm text-gray-400">
        <Link href={`/store/${storeSlug}`} className="transition-colors hover:text-gray-700">Գլխավոր</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/store/${storeSlug}/products`} className="transition-colors hover:text-gray-700">Ապրանքներ</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-gray-900">{name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-black/[0.04]">
            {isOnSale && savingsPct > 0 && (
              <div className="absolute left-3 top-3 z-10 rounded-xl px-2.5 py-1 text-xs font-black text-white shadow-sm" style={{ backgroundColor: 'var(--accent)' }}>
                −{savingsPct}%
              </div>
            )}
            {product.images?.[activeImageIdx] ? (
              <Image
                src={product.images[activeImageIdx].large}
                alt={name}
                fill
                className="object-contain transition-opacity duration-200"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-200">
                <ShoppingBag className="h-20 w-20" />
              </div>
            )}
          </div>

          {(product.images?.length ?? 0) > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {product.images?.map((img, i) => (
                <button
                  key={img.uuid}
                  onClick={() => setActiveImageIdx(i)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl ring-2 transition-all ${
                    activeImageIdx === i
                      ? 'ring-[var(--accent)] opacity-100'
                      : 'ring-transparent opacity-60 hover:opacity-100'
                  }`}
                  aria-label={`Image ${i + 1}`}
                >
                  <Image src={img.thumbnail} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          {/* Title + rating */}
          <div>
            {product.rating_avg && product.rating_count ? (
              <div className="mb-2 flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < Math.round(product.rating_avg!) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
                  />
                ))}
                <span className="text-xs text-gray-500">({product.rating_count})</span>
              </div>
            ) : null}
            <h1 className="text-2xl font-black leading-tight text-gray-900 sm:text-3xl">{name}</h1>
            {descShort && (
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{descShort}</p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-gray-900">{price.toLocaleString()} ֏</span>
            {isOnSale && (
              <>
                <span className="text-lg text-gray-400 line-through">{product.compare_price!.toLocaleString()} ֏</span>
                <span className="rounded-lg px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: 'var(--accent)' }}>
                  Խնայեք {(product.compare_price! - price).toLocaleString()} ֏
                </span>
              </>
            )}
          </div>

          {!inStock && (
            <span className="inline-flex w-fit rounded-full bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600 ring-1 ring-red-200">
              Ապրանքն առկա չէ
            </span>
          )}

          {/* Variants */}
          {attributeKeys.length > 0 && (
            <div className="flex flex-col gap-4">
              {attributeKeys.map((key) => {
                const values = [...new Set(activeVariants.map((v) => v.attributes[key]).filter(Boolean))]
                return (
                  <div key={key}>
                    <p className="mb-2.5 text-sm font-bold text-gray-800">{key}</p>
                    <div className="flex flex-wrap gap-2">
                      {values.map((val) => {
                        const variant = activeVariants.find((v) => v.attributes[key] === val)
                        const isSelected = selectedVariant?.attributes[key] === val
                        return (
                          <button
                            key={val}
                            onClick={() => variant && setSelectedVariant(variant)}
                            className={`rounded-xl border-2 px-4 py-1.5 text-sm font-semibold transition-all ${
                              isSelected
                                ? 'border-[var(--accent)] text-[var(--accent)]'
                                : 'border-gray-200 text-gray-600 hover:border-gray-400'
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

          {/* Qty + CTA */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-2xl border-2 border-gray-200">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-12 w-12 items-center justify-center text-gray-600 transition-colors hover:text-gray-900"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-12 w-12 items-center justify-center text-gray-600 transition-colors hover:text-gray-900"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!inStock || isPreview}
              className={`flex flex-1 items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-bold shadow-sm transition-all ${
                added
                  ? 'bg-emerald-500 text-white shadow-emerald-200'
                  : inStock && !isPreview
                  ? 'text-white shadow-lg hover:opacity-90 hover:shadow-xl'
                  : 'cursor-not-allowed bg-gray-100 text-gray-400'
              }`}
              style={added || !inStock || isPreview ? {} : { backgroundColor: 'var(--accent)' }}
            >
              {added ? (
                <><Check className="h-4 w-4" /> Ավելացվեց</>
              ) : (
                <><ShoppingBag className="h-4 w-4" /> {inStock ? 'Ավելացնել զամբյուղ' : 'Ոչ առկա'}</>
              )}
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-gray-50 p-4">
            {[
              { icon: Truck, label: 'Արագ առաքում' },
              { icon: ShieldCheck, label: 'Անվտանգ' },
              { icon: RefreshCw, label: 'Վերադարձ' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <Icon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                <span className="text-[11px] font-medium text-gray-600">{label}</span>
              </div>
            ))}
          </div>

          {/* Description tabs */}
          {descFull && (
            <div>
              <div className="flex border-b border-gray-200">
                {(['description', 'details'] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {tab === 'description' ? 'Նկարագրություն' : 'Մանրամասներ'}
                  </button>
                ))}
              </div>
              <div className="pt-4">
                {activeTab === 'description' && (
                  <div
                    className="prose prose-sm max-w-none text-gray-600 prose-headings:font-bold prose-headings:text-gray-800"
                    dangerouslySetInnerHTML={{ __html: descFull }}
                  />
                )}
                {activeTab === 'details' && (
                  <dl className="flex flex-col gap-2">
                    {product.manage_stock && (
                      <div className="flex gap-3 text-sm">
                        <dt className="w-24 flex-shrink-0 font-semibold text-gray-700">Պաշար</dt>
                        <dd className="text-gray-500">{inStock ? `${product.stock} հատ` : 'Ոչ առկա'}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {!isPreview && (
        <ReviewSection
          reviews={product.reviews ?? []}
          ratingAvg={product.rating_avg ?? null}
          ratingCount={product.rating_count ?? 0}
          storeSlug={storeSlug}
          productSlug={product.slug}
        />
      )}
    </div>
  )
}
