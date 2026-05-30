'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShoppingBag, Plus, Minus, Check, ChevronRight,
  ShieldCheck, RefreshCw, Truck, ChevronDown, Star, X, Eye,
} from 'lucide-react'
import { useLocale } from 'next-intl'
import { useStoreCart } from '@/stores/cart.store'
import ReviewSection from '@/components/store/ReviewSection'
import { formatViewCount } from '@/lib/formatViewCount'
import { pickLang } from '@/lib/i18n'
import type { ProductDetailProps, StorefrontVariant } from '../types'

function StarRating({ avg, count }: { avg: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'fill-gray-100 text-gray-200'}`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-500">
        {avg.toFixed(1)} <span className="text-gray-300">·</span> {count} կarwick
      </span>
    </div>
  )
}

function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pb-4 text-sm leading-relaxed text-gray-600 animate-slide-down">
          {children}
        </div>
      )}
    </div>
  )
}

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close">
        <X className="h-5 w-5" />
      </button>
      <div className="relative h-[85vh] w-[85vw] max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <Image src={src} alt={alt} fill className="object-contain" />
      </div>
    </div>
  )
}

export function ProductDetail({ product, storeSlug, isPreview }: ProductDetailProps) {
  const activeVariants = product.variants?.filter((v) => v.is_active) ?? []
  const [selectedVariant, setSelectedVariant] = useState<StorefrontVariant | null>(activeVariants[0] ?? null)
  const [quantity, setQuantity] = useState(1)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [added, setAdded] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const ctaRef = useRef<HTMLDivElement>(null)

  const { addItem } = useStoreCart(storeSlug)

  useEffect(() => {
    const el = ctaRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), { threshold: 0 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const price = selectedVariant ? selectedVariant.price : product.price
  const inStock = selectedVariant
    ? !product.manage_stock || selectedVariant.stock > 0
    : !product.manage_stock || product.stock > 0

  const isOnSale = product.compare_price && product.compare_price > price
  const savingsPct = isOnSale ? Math.round(((product.compare_price! - price) / product.compare_price!) * 100) : 0

  const attributeKeys = activeVariants.length
    ? [...new Set(activeVariants.flatMap((v) => Object.keys(v.attributes)))]
    : []

  function handleAddToCart() {
    if (isPreview || !inStock) return
    addItem(product, selectedVariant ?? undefined, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  const locale = useLocale()
  const name = pickLang(product.name, locale)
  const descFull = pickLang(product.description_full, locale)
  const descShort = pickLang(product.description_short, locale)
  const activeImage = product.images?.[activeImageIdx]

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-1.5 text-sm text-gray-400">
          <Link href={`/store/${storeSlug}`} className="transition-colors hover:text-gray-700">Գлхавор</Link>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
          <Link href={`/store/${storeSlug}/products`} className="transition-colors hover:text-gray-700">Апранqner</Link>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-medium text-gray-900 line-clamp-1">{name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* ── Gallery ── */}
          <div className="flex flex-col gap-3">
            <div
              className="group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-3xl bg-gray-50 ring-1 ring-black/[0.04]"
              onClick={() => activeImage && setLightboxOpen(true)}
            >
              {isOnSale && savingsPct > 0 && (
                <div className="absolute left-4 top-4 z-10 rounded-xl px-3 py-1.5 text-xs font-black text-white shadow" style={{ backgroundColor: 'var(--accent)' }}>
                  −{savingsPct}%
                </div>
              )}
              {activeImage ? (
                <Image
                  src={activeImage.large}
                  alt={name}
                  fill
                  className="object-contain transition-transform duration-500 group-hover:scale-105"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ShoppingBag className="h-20 w-20 text-gray-200" />
                </div>
              )}
              {(product.images?.length ?? 0) > 1 && (
                <div className="absolute bottom-3 right-3 rounded-lg bg-black/50 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                  {activeImageIdx + 1} / {product.images!.length}
                </div>
              )}
            </div>

            {(product.images?.length ?? 0) > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {product.images!.map((img, i) => (
                  <button
                    key={img.uuid}
                    onClick={() => setActiveImageIdx(i)}
                    className={`relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl transition-all ${
                      activeImageIdx === i
                        ? 'ring-2 ring-[var(--accent)] ring-offset-1'
                        : 'opacity-50 hover:opacity-80 ring-1 ring-black/[0.04]'
                    }`}
                    aria-label={`Image ${i + 1}`}
                  >
                    <Image src={img.thumbnail} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info ── */}
          <div className="flex flex-col gap-6">
            {/* Rating + views row */}
            <div className="flex flex-wrap items-center gap-4">
              {product.rating_avg != null && (product.rating_count ?? 0) > 0 && (
                <StarRating avg={product.rating_avg} count={product.rating_count!} />
              )}
              {product.view_count > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Eye className="h-4 w-4" />
                  <span>{formatViewCount(product.view_count)} դիտum</span>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl font-black leading-tight text-gray-900 sm:text-4xl">{name}</h1>
              {descShort && (
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{descShort}</p>
              )}
            </div>

            {/* Price */}
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-black text-gray-900">{price.toLocaleString()} ֏</span>
              {isOnSale && (
                <>
                  <span className="text-lg text-gray-400 line-through">{product.compare_price!.toLocaleString()} ֏</span>
                  <span className="rounded-lg px-2.5 py-1 text-xs font-bold text-white" style={{ backgroundColor: 'var(--accent)' }}>
                    Խnayeq {(product.compare_price! - price).toLocaleString()} ֏
                  </span>
                </>
              )}
            </div>

            {!inStock && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 ring-1 ring-red-200">
                <span className="text-sm font-semibold text-red-600">Апрanqn аrka chE</span>
              </div>
            )}

            {/* Variants */}
            {attributeKeys.length > 0 && (
              <div className="flex flex-col gap-5">
                {attributeKeys.map((key) => {
                  const values = [...new Set(activeVariants.map((v) => v.attributes[key]).filter(Boolean))]
                  return (
                    <div key={key}>
                      <p className="mb-2.5 text-sm font-bold text-gray-800">
                        {key}
                        {selectedVariant?.attributes[key] && (
                          <span className="ml-2 font-normal text-gray-500">— {selectedVariant.attributes[key]}</span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {values.map((val) => {
                          const variant = activeVariants.find((v) => v.attributes[key] === val)
                          const isSelected = selectedVariant?.attributes[key] === val
                          const outOfStock = variant && product.manage_stock && variant.stock === 0
                          return (
                            <button
                              key={val}
                              onClick={() => variant && setSelectedVariant(variant)}
                              disabled={!!outOfStock}
                              className={`relative rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all ${
                                isSelected
                                  ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,white)] text-[var(--accent)]'
                                  : outOfStock
                                  ? 'cursor-not-allowed border-gray-100 text-gray-300 line-through'
                                  : 'border-gray-200 text-gray-700 hover:border-gray-400'
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
            <div ref={ctaRef} className="flex items-center gap-3">
              <div className="flex items-center overflow-hidden rounded-2xl border-2 border-gray-200">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-12 w-12 items-center justify-center text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  aria-label="Decrease"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-9 text-center text-sm font-bold text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-12 w-12 items-center justify-center text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  aria-label="Increase"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!inStock || isPreview}
                className={`flex flex-1 items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-bold shadow transition-all ${
                  added
                    ? 'bg-emerald-500 text-white shadow-emerald-200'
                    : inStock && !isPreview
                    ? 'text-white shadow-lg hover:opacity-90 hover:shadow-xl hover:-translate-y-px'
                    : 'cursor-not-allowed bg-gray-100 text-gray-400 shadow-none'
                }`}
                style={added || !inStock || isPreview ? {} : { backgroundColor: 'var(--accent)' }}
              >
                {added ? (
                  <><Check className="h-4 w-4" /> Ավелацвец</>
                ) : (
                  <><ShoppingBag className="h-4 w-4" /> {inStock ? 'Авелацнел zambyugh' : 'Voch аrka'}</>
                )}
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 rounded-2xl border border-gray-100 bg-gray-50/60">
              {[
                { icon: Truck,       label: 'Arach araqum' },
                { icon: ShieldCheck, label: 'Anvtang' },
                { icon: RefreshCw,   label: 'Heshot veradardz' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 py-4 text-center">
                  <Icon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                  <span className="text-[11px] font-medium leading-tight text-gray-500">{label}</span>
                </div>
              ))}
            </div>

            {/* Accordion */}
            {descFull && (
              <div className="rounded-2xl border border-gray-100 bg-white px-5">
                <AccordionItem title="Нкarаgrut'yun">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: descFull }}
                  />
                </AccordionItem>
                <AccordionItem title="Маnrаmаsner">
                  <div className="flex flex-col gap-2">
                    {product.manage_stock && (
                      <div className="flex gap-3 text-sm">
                        <span className="w-20 flex-shrink-0 font-semibold text-gray-700">Разделение</span>
                        <span className="text-gray-500">{inStock ? `${product.stock} haт` : 'Voch аrka'}</span>
                      </div>
                    )}
                  </div>
                </AccordionItem>
                <AccordionItem title="Аraqum ev veradardz">
                  <p>Anvachar araqum 10,000 ֏-ic аveli pan ganarkelov. Veradardzy handartavorum е 14 ores bnaqancin.</p>
                </AccordionItem>
              </div>
            )}
          </div>
        </div>

        {!isPreview && (
          <div className="mt-16">
            <ReviewSection
              reviews={product.reviews ?? []}
              ratingAvg={product.rating_avg ?? null}
              ratingCount={product.rating_count ?? 0}
              storeSlug={storeSlug}
              productSlug={product.slug}
            />
          </div>
        )}
      </div>

      {/* ── Sticky add-to-cart bar ── */}
      {!isPreview && (
        <div
          className={`fixed inset-x-0 bottom-0 z-30 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.08)] transition-all duration-300 ${
            showStickyBar ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}
        >
          <div className="mx-auto flex max-w-5xl items-center gap-4">
            <div className="hidden items-center gap-3 sm:flex">
              {activeImage && (
                <div className="relative h-12 w-12 overflow-hidden rounded-xl ring-1 ring-black/[0.04]">
                  <Image src={activeImage.thumbnail} alt={name} fill className="object-cover" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900 line-clamp-1">{name}</p>
                <p className="text-sm font-black" style={{ color: 'var(--accent)' }}>{price.toLocaleString()} ֏</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center overflow-hidden rounded-xl border-2 border-gray-200">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex h-10 w-10 items-center justify-center text-gray-500 hover:bg-gray-50">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)} className="flex h-10 w-10 items-center justify-center text-gray-500 hover:bg-gray-50">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${added ? 'bg-emerald-500' : ''}`}
                style={added ? {} : { backgroundColor: 'var(--accent)' }}
              >
                {added ? <><Check className="h-4 w-4" /> Avaelacvec</> : <><ShoppingBag className="h-4 w-4" /> Avaelacnel</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxOpen && activeImage && (
        <Lightbox src={activeImage.large} alt={name} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  )
}
