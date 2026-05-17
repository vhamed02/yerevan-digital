'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { ProductCard } from './ProductCard'
import { ProductGrid } from './ProductGrid'
import type { StoreHomeProps } from '../types'

function FeaturedSlider({
  products,
  storeSlug,
  isPreview,
}: {
  products: import('../types').StorefrontProduct[]
  storeSlug: string
  isPreview?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    ref.current?.scrollBy({ left: dir === 'right' ? 288 : -288, behavior: 'smooth' })
  }

  return (
    <div className="relative -mx-4 px-4 sm:-mx-0 sm:px-0">
      <button
        onClick={() => scroll('left')}
        className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 hidden rounded-full bg-white p-2 shadow-md hover:shadow-lg transition-shadow sm:flex items-center justify-center text-gray-600 hover:text-gray-900"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-3"
        style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div
            key={product.uuid}
            className="w-56 flex-shrink-0 sm:w-64"
            style={{ scrollSnapAlign: 'start' }}
          >
            <ProductCard product={product} storeSlug={storeSlug} isPreview={isPreview} />
          </div>
        ))}
      </div>

      <button
        onClick={() => scroll('right')}
        className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 hidden rounded-full bg-white p-2 shadow-md hover:shadow-lg transition-shadow sm:flex items-center justify-center text-gray-600 hover:text-gray-900"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}

export function StoreHome({
  store,
  featuredProducts,
  products,
  categories,
  slug,
  isPreview,
}: StoreHomeProps) {
  const name = store.name.hy || store.name.en
  const description = store.description?.hy || store.description?.en
  const showFeaturedSlider = store.template_config.show_featured_slider !== false
  const showCategoryBar = store.template_config.show_categories_bar !== false

  return (
    <div>
      {/* Hero */}
      {store.banner_url && store.template_config.show_hero_banner !== false ? (
        <div className="relative h-[52vh] min-h-[320px] w-full overflow-hidden">
          <Image
            src={store.banner_url}
            alt={name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
          <div className="absolute inset-0 flex items-end justify-start px-6 pb-10 sm:px-12">
            <div className="max-w-xl">
              <h1 className="text-3xl font-bold text-white drop-shadow-sm sm:text-5xl">{name}</h1>
              {description && (
                <p className="mt-2 text-sm text-white/85 sm:text-base">{description}</p>
              )}
              <Link
                href={`/store/${slug}/products`}
                className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Տեսնել ապրանքները <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="relative overflow-hidden px-6 py-16 text-center sm:py-24"
          style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary, var(--accent)) 100%)' }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />
          <div className="relative mx-auto max-w-xl">
            <h1 className="text-3xl font-bold text-white sm:text-5xl">{name}</h1>
            {description && (
              <p className="mt-3 text-white/80">{description}</p>
            )}
            <Link
              href={`/store/${slug}/products`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ color: 'var(--accent)' }}
            >
              Տեսնել ապրանքները <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Category bar */}
        {showCategoryBar && categories.length > 0 && (
          <div className="mb-10 flex items-center gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            <Link
              href={`/store/${slug}/products`}
              className="flex-shrink-0 rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              Բոլոր
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/store/${slug}/products?category=${cat.slug}`}
                className="flex-shrink-0 rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors whitespace-nowrap hover:border-current"
                style={{ ['--tw-hover-text' as string]: 'var(--accent)' }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--accent)'
                  ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.borderColor = ''
                  ;(e.currentTarget as HTMLAnchorElement).style.color = ''
                }}
              >
                {cat.name.hy || cat.name.en}
              </Link>
            ))}
          </div>
        )}

        {/* Featured slider */}
        {showFeaturedSlider && featuredProducts.length > 0 && (
          <section className="mb-12">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Ուշագրավ ապրանքներ</h2>
                <div className="mt-1 h-0.5 w-12 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
              </div>
              <Link
                href={`/store/${slug}/products?featured=1`}
                className="flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--accent)' }}
              >
                Բոլորը <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <FeaturedSlider products={featuredProducts} storeSlug={slug} isPreview={isPreview} />
          </section>
        )}

        {/* All products */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {featuredProducts.length > 0 ? 'Բոլոր ապրանքները' : 'Ապրանքներ'}
              </h2>
              <div className="mt-1 h-0.5 w-12 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
            </div>
            <Link
              href={`/store/${slug}/products`}
              className="flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--accent)' }}
            >
              Բոլորը <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ProductGrid products={products} storeSlug={slug} isPreview={isPreview} />
        </section>
      </div>
    </div>
  )
}
