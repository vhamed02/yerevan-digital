'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronLeft, ChevronRight, ArrowRight,
  ShieldCheck, RefreshCw, Truck, HeadphonesIcon,
  Sparkles, Star,
} from 'lucide-react'
import { ProductCard } from './ProductCard'
import { ProductGrid } from './ProductGrid'
import type { StoreHomeProps, StorefrontProduct, PublicCategory } from '../types'

const TRUST_ITEMS = [
  { icon: Truck,           label: 'Անվճար առաքում' },
  { icon: ShieldCheck,     label: 'Անվտանգ վճարում' },
  { icon: RefreshCw,       label: 'Հեշտ վերադարձ' },
  { icon: HeadphonesIcon,  label: '24/7 աջակցություն' },
]

const MARQUEE_ITEMS = [
  { icon: Sparkles, text: 'Բարձրորակ ապրանքներ' },
  { icon: Truck,    text: 'Արագ առաքում' },
  { icon: Star,     text: 'Հավատարիմ հաճախորդներ' },
  { icon: ShieldCheck, text: 'Անվտանգ գնումներ' },
  { icon: RefreshCw,   text: 'Հեշտ վերադարձ' },
  { icon: Sparkles, text: 'Ամենօրյա նոր ապրանքներ' },
]

function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div className="overflow-hidden border-y border-gray-100 py-3.5" style={{ backgroundColor: '#fafafa' }}>
      <div className="flex w-max animate-marquee gap-0">
        {doubled.map(({ icon: Icon, text }, i) => (
          <span key={i} className="flex flex-shrink-0 items-center gap-2 px-8 text-sm font-medium text-gray-500">
            <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
            {text}
            <span className="ml-6 text-gray-200">—</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function FeaturedSlider({ products, storeSlug, isPreview }: { products: StorefrontProduct[]; storeSlug: string; isPreview?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  function scroll(dir: 'left' | 'right') {
    ref.current?.scrollBy({ left: dir === 'right' ? 304 : -304, behavior: 'smooth' })
  }
  return (
    <div className="relative">
      <button
        onClick={() => scroll('left')}
        className="absolute -left-5 top-[45%] z-10 hidden -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/[0.06] transition-all hover:scale-105 hover:shadow-xl sm:flex"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4 text-gray-700" />
      </button>
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-3"
        style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
      >
        {products.map((p) => (
          <div key={p.uuid} className="w-60 flex-shrink-0 sm:w-72" style={{ scrollSnapAlign: 'start' }}>
            <ProductCard product={p} storeSlug={storeSlug} isPreview={isPreview} />
          </div>
        ))}
      </div>
      <button
        onClick={() => scroll('right')}
        className="absolute -right-5 top-[45%] z-10 hidden -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/[0.06] transition-all hover:scale-105 hover:shadow-xl sm:flex"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4 text-gray-700" />
      </button>
    </div>
  )
}

function CategoryCards({ categories, slug }: { categories: PublicCategory[]; slug: string }) {
  const PALETTES = [
    'from-violet-500 to-indigo-600',
    'from-rose-400 to-pink-600',
    'from-amber-400 to-orange-500',
    'from-emerald-400 to-teal-600',
    'from-sky-400 to-blue-600',
    'from-fuchsia-400 to-purple-600',
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <Link
        href={`/store/${slug}/products`}
        className="group relative flex h-24 items-end overflow-hidden rounded-2xl p-4 ring-1 ring-black/[0.04] transition-all hover:-translate-y-0.5 hover:shadow-lg"
        style={{ background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, black))' }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <span className="relative text-sm font-bold text-white drop-shadow">Բոլոր</span>
      </Link>
      {categories.slice(0, 7).map((cat, i) => (
        <Link
          key={cat.id}
          href={`/store/${slug}/products?category=${cat.slug}`}
          className={`group relative flex h-24 items-end overflow-hidden rounded-2xl bg-gradient-to-br p-4 ring-1 ring-black/[0.04] transition-all hover:-translate-y-0.5 hover:shadow-lg ${PALETTES[i % PALETTES.length]}`}
        >
          <div className="pointer-events-none absolute inset-0 bg-black/10 opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="relative text-sm font-bold text-white drop-shadow line-clamp-2">
            {cat.name.hy || cat.name.en}
          </span>
        </Link>
      ))}
    </div>
  )
}

function FeaturedSpotlight({ product, storeSlug, isPreview }: { product: StorefrontProduct; storeSlug: string; isPreview?: boolean }) {
  const name = product.name.hy || product.name.en
  const image = product.images?.[0]
  const isOnSale = product.compare_price && product.compare_price > product.price
  const savingsPct = isOnSale ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100) : 0

  return (
    <Link href={`/store/${storeSlug}/products/${product.slug}`} className="group block">
      <div className="grid grid-cols-1 overflow-hidden rounded-3xl ring-1 ring-black/[0.06] transition-all duration-300 group-hover:shadow-xl sm:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 sm:aspect-auto sm:min-h-[360px]">
          {image ? (
            <Image
              src={image.large}
              alt={name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-100" />
          )}
          {isOnSale && savingsPct > 0 && (
            <div className="absolute left-4 top-4 rounded-xl px-3 py-1 text-sm font-black text-white shadow" style={{ backgroundColor: 'var(--accent)' }}>
              −{savingsPct}%
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center gap-5 bg-white p-8 sm:p-10">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
              Ուշագրավ ապրանք
            </p>
            <h3 className="text-2xl font-black leading-tight text-gray-900 sm:text-3xl">{name}</h3>
            {product.description_short && (
              <p className="mt-3 text-sm leading-relaxed text-gray-500 line-clamp-3">
                {product.description_short.hy || product.description_short.en}
              </p>
            )}
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-gray-900">{product.price.toLocaleString()} ֏</span>
            {isOnSale && (
              <span className="text-base text-gray-400 line-through">{product.compare_price!.toLocaleString()} ֏</span>
            )}
          </div>
          <div
            className="inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-md shadow-black/10 transition-all group-hover:gap-3 group-hover:shadow-lg"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Գնել հիմա <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  )
}

function SectionHeading({ eyebrow, title, href }: { eyebrow?: string; title: string; href?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Բոլորը <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  )
}

export function StoreHome({ store, featuredProducts, products, categories, slug, isPreview }: StoreHomeProps) {
  const name = store.name.hy || store.name.en
  const description = store.description?.hy || store.description?.en
  const showFeaturedSlider = store.template_config.show_featured_slider !== false
  const showCategoryBar = store.template_config.show_categories_bar !== false
  const showTrustStrip = store.template_config.show_trust_strip !== false

  const [spotlightProduct, ...sliderProducts] = featuredProducts

  return (
    <div>
      {/* ─── Hero ─── */}
      {store.banner_url && store.template_config.show_hero_banner !== false ? (
        <div className="relative h-[65vh] min-h-[400px] w-full overflow-hidden sm:h-[75vh]">
          <Image src={store.banner_url} alt={name} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex items-center px-6 sm:px-16 lg:px-24">
            <div className="max-w-xl animate-fade-up">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">
                {name}
              </p>
              <h1 className="text-5xl font-black leading-[1.02] text-white drop-shadow-sm sm:text-7xl">
                {description ? description.split(' ').slice(0, 4).join(' ') : name}
              </h1>
              {description && (
                <p className="mt-5 max-w-sm text-base leading-relaxed text-white/75">{description}</p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/store/${slug}/products`}
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-black/20 transition-all hover:scale-105 hover:shadow-2xl"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Տեսնել ամբողջ հավաքածուն <ArrowRight className="h-4 w-4" />
                </Link>
                {featuredProducts.length > 0 && (
                  <Link
                    href={`/store/${slug}/products?featured=1`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                  >
                    Ուշագրավ ↗
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="relative overflow-hidden py-28 text-center sm:py-40"
          style={{ background: 'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 60%, black) 100%)' }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }} />
          <div className="relative mx-auto max-w-2xl px-6 animate-fade-up">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">Բացահայտե՛ք</p>
            <h1 className="text-6xl font-black leading-[1.02] text-white sm:text-8xl">{name}</h1>
            {description && <p className="mt-5 text-lg text-white/70">{description}</p>}
            <Link
              href={`/store/${slug}/products`}
              className="mt-10 inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-4 text-sm font-bold shadow-2xl shadow-black/20 transition-all hover:scale-105"
              style={{ color: 'var(--accent)' }}
            >
              Գնել հիմա <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ─── Marquee ─── */}
      <Marquee />

      {/* ─── Trust strip ─── */}
      {showTrustStrip && (
        <div className="bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-around gap-2 overflow-x-auto px-4 py-4" style={{ scrollbarWidth: 'none' }}>
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-shrink-0 items-center gap-2.5 px-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 12%, white)' }}>
                  <Icon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                </div>
                <span className="whitespace-nowrap text-xs font-semibold text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-14 flex flex-col gap-20">

        {/* ─── Categories ─── */}
        {showCategoryBar && categories.length > 0 && (
          <section>
            <SectionHeading eyebrow="Բաժիններ" title="Ի՞նչ եք փնտրում" href={`/store/${slug}/products`} />
            <CategoryCards categories={categories} slug={slug} />
          </section>
        )}

        {/* ─── Featured spotlight (first featured product, editorial) ─── */}
        {showFeaturedSlider && spotlightProduct && (
          <section>
            <SectionHeading eyebrow="Ընտրանի" title="Ուշագրավ ապրանք" />
            <FeaturedSpotlight product={spotlightProduct} storeSlug={slug} isPreview={isPreview} />
          </section>
        )}

        {/* ─── Featured slider (remaining featured products) ─── */}
        {showFeaturedSlider && sliderProducts.length > 0 && (
          <section>
            <SectionHeading
              eyebrow="Հավաքածու"
              title="Ամենասիրված ապրանքները"
              href={`/store/${slug}/products?featured=1`}
            />
            <FeaturedSlider products={sliderProducts} storeSlug={slug} isPreview={isPreview} />
          </section>
        )}

        {/* ─── All products ─── */}
        <section>
          <SectionHeading
            eyebrow={featuredProducts.length > 0 ? 'Ամբողջ հավաքածուն' : undefined}
            title="Բոլոր ապրանքները"
            href={`/store/${slug}/products`}
          />
          <ProductGrid products={products} storeSlug={slug} isPreview={isPreview} />
        </section>
      </div>
    </div>
  )
}
