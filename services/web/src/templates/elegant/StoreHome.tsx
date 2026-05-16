'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ProductGrid } from './ProductGrid'
import { ProductCard } from './ProductCard'
import type { StoreHomeProps } from '../types'

export function StoreHome({
  store,
  featuredProducts,
  products,
  categories,
  slug,
  isPreview,
}: StoreHomeProps) {
  const name = store.name.hy || store.name.en

  return (
    <div>
      <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-stone-100">
        {store.banner_url && (
          <Image
            src={store.banner_url}
            alt={name}
            fill
            className="object-cover"
            style={{ transform: 'scale(1.05)' }}
            priority
          />
        )}
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <div className="bg-white/80 px-10 py-8 backdrop-blur-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
              Welcome to
            </p>
            <h1
              className="text-4xl font-bold text-stone-900 sm:text-6xl"
              style={{ fontFamily: 'Georgia, "Playfair Display", serif' }}
            >
              {name}
            </h1>
            {store.description && (
              <p className="mt-4 text-stone-600 max-w-md">
                {store.description.hy || store.description.en}
              </p>
            )}
            <Link
              href={`/store/${slug}/products`}
              className="mt-6 inline-block border-b-2 border-stone-900 pb-0.5 text-xs font-semibold uppercase tracking-widest text-stone-900 hover:border-stone-600 hover:text-stone-600 transition-colors"
            >
              Explore Collection
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-16">
        {featuredProducts.length > 0 && (
          <section className="mb-16">
            <h2
              className="mb-8 text-center text-2xl font-bold text-stone-800 sm:text-3xl"
              style={{ fontFamily: 'Georgia, "Playfair Display", serif' }}
            >
              Our Collection
            </h2>
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
              {featuredProducts.slice(0, 4).map((product, i) => (
                <div
                  key={product.uuid}
                  className={`flex items-center gap-6 ${i % 2 === 1 ? 'flex-row-reverse' : ''}`}
                >
                  <div className="relative h-64 w-48 flex-shrink-0 overflow-hidden bg-stone-100 sm:h-72">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0].large}
                        alt={product.name.hy || product.name.en}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-stone-200 text-4xl">
                        🛍
                      </div>
                    )}
                  </div>
                  <div>
                    <p
                      className="text-lg font-bold text-stone-800"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      {product.name.hy || product.name.en}
                    </p>
                    {product.description_short && (
                      <p className="mt-2 text-sm text-stone-500 leading-relaxed">
                        {product.description_short.hy || product.description_short.en}
                      </p>
                    )}
                    <p className="mt-3 text-stone-700">{product.price.toLocaleString()} ֏</p>
                    <Link
                      href={`/store/${slug}/products/${product.slug}`}
                      className="mt-4 inline-block border-b border-stone-900 pb-0.5 text-xs font-semibold uppercase tracking-widest text-stone-900 hover:border-stone-500 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2
            className="mb-8 text-center text-2xl font-bold text-stone-800 sm:text-3xl"
            style={{ fontFamily: 'Georgia, "Playfair Display", serif' }}
          >
            {featuredProducts.length > 0 ? 'More Products' : 'Our Products'}
          </h2>
          <ProductGrid products={products} storeSlug={slug} isPreview={isPreview} />
          {products.length >= 12 && (
            <div className="mt-10 text-center">
              <Link
                href={`/store/${slug}/products`}
                className="inline-block border-b-2 border-stone-900 pb-0.5 text-xs font-semibold uppercase tracking-widest text-stone-900 hover:border-stone-500 transition-colors"
              >
                View All Products
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
