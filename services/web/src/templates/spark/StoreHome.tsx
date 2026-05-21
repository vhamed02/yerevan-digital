'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, RefreshCw, Truck, HeadphonesIcon } from 'lucide-react'
import { ProductCard } from './ProductCard'
import { ProductGrid } from './ProductGrid'
import type { StoreHomeProps, StorefrontProduct } from '../types'

const TRUST_ITEMS = [
  { icon: Truck, label: 'Անվճար առաքում' },
  { icon: ShieldCheck, label: 'Անվտանգ վճարում' },
  { icon: RefreshCw, label: 'Հեշտ վերադարձ' },
  { icon: HeadphonesIcon, label: '24/7 աջակցություն' },
]

function FeaturedSlider({
  products,
  storeSlug,
  isPreview,
}: {
  products: StorefrontProduct[]
  storeSlug: string
  isPreview?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    ref.current?.scrollBy({ left: dir === 'right' ? 300 : -300, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <button
        onClick={() => scroll('left')}
        className="absolute -left-5 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white p-2.5 shadow-lg ring-1 ring-black/5 transition-all hover:scale-105 hover:shadow-xl sm:flex"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4 text-gray-700" />
      </button>

      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
      >
        {products.map((product) => (
          <div key={product.uuid} className="w-60 flex-shrink-0 sm:w-72" style={{ scrollSnapAlign: 'start' }}>
            <ProductCard product={product} storeSlug={storeSlug} isPreview={isPreview} />
          </div>
        ))}
      </div>

      <button
        onClick={() => scroll('right')}
        className="absolute -right-5 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white p-2.5 shadow-lg ring-1 ring-black/5 transition-all hover:scale-105 hover:shadow-xl sm:flex"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4 text-gray-700" />
      </button>
    </div>
  )
}

function SectionHeading({ eyebrow, title, href, linkLabel }: { eyebrow?: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-7 flex items-end justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
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

  return (
    <div>
      {/* Hero */}
      {store.banner_url && store.template_config.show_hero_banner !== false ? (
        <div className="relative h-[60vh] min-h-[380px] w-full overflow-hidden sm:h-[70vh]">
          <Image src={store.banner_url} alt={name} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex items-center px-6 sm:px-16">
            <div className="max-w-lg">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                Բացահայտե՛ք մեր հավաքածուն
              </p>
              <h1 className="text-4xl font-black leading-[1.05] text-white drop-shadow sm:text-6xl">{name}</h1>
              {description && (
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80 sm:text-base">{description}</p>
              )}
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={`/store/${slug}/products`}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg shadow-black/20 transition-all hover:scale-105 hover:shadow-xl"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Տեսնել ապրանքները <ArrowRight className="h-4 w-4" />
                </Link>
                {featuredProducts.length > 0 && (
                  <Link
                    href={`/store/${slug}/products?featured=1`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                  >
                    Ուշագրավ
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="relative overflow-hidden py-24 text-center sm:py-32"
          style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary, color-mix(in srgb, var(--accent) 70%, black)) 100%)' }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}
          />
          <div className="relative mx-auto max-w-2xl px-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Բացահայտե՛ք</p>
            <h1 className="text-5xl font-black leading-tight text-white sm:text-7xl">{name}</h1>
            {description && (
              <p className="mt-4 text-white/75 sm:text-lg">{description}</p>
            )}
            <Link
              href={`/store/${slug}/products`}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold shadow-xl shadow-black/20 transition-all hover:scale-105"
              style={{ color: 'var(--accent)' }}
            >
              Տեսնել ապրանքները <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Trust strip */}
      {showTrustStrip && (
        <div className="border-b border-t border-gray-100 bg-gray-50/70">
          <div className="mx-auto flex max-w-6xl items-center justify-around gap-2 overflow-x-auto px-4 py-3.5" style={{ scrollbarWidth: 'none' }}>
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-shrink-0 items-center gap-2 px-3 py-1">
                <Icon className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <span className="whitespace-nowrap text-xs font-medium text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Category bar */}
        {showCategoryBar && categories.length > 0 && (
          <div className="mb-12 flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <Link
              href={`/store/${slug}/products`}
              className="flex-shrink-0 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Բոլոր
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/store/${slug}/products?category=${cat.slug}`}
                className="flex-shrink-0 rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all whitespace-nowrap hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-md"
              >
                {cat.name.hy || cat.name.en}
              </Link>
            ))}
          </div>
        )}

        {/* Featured slider */}
        {showFeaturedSlider && featuredProducts.length > 0 && (
          <section className="mb-16">
            <SectionHeading
              eyebrow="Ուշագրավ"
              title="Ընտրանի ապրանքներ"
              href={`/store/${slug}/products?featured=1`}
              linkLabel="Բոլորը"
            />
            <FeaturedSlider products={featuredProducts} storeSlug={slug} isPreview={isPreview} />
          </section>
        )}

        {/* All products */}
        <section>
          <SectionHeading
            eyebrow={featuredProducts.length > 0 ? 'Հավաքածու' : undefined}
            title={featuredProducts.length > 0 ? 'Բոլոր ապրանքները' : 'Ապրանքներ'}
            href={`/store/${slug}/products`}
            linkLabel="Բոլորը"
          />
          <ProductGrid products={products} storeSlug={slug} isPreview={isPreview} />
        </section>
      </div>
    </div>
  )
}
