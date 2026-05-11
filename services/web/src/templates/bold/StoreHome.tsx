'use client'

import Link from 'next/link'
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
  const primary = store.template_config.primary_color || '#6366f1'
  const secondary = store.template_config.secondary_color || '#8b5cf6'

  return (
    <div>
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-20 text-center"
        style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
      >
        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-white sm:text-6xl">
          {name}
        </h1>
        {store.description && (
          <p className="mt-4 max-w-lg text-white/80 text-lg">
            {store.description.hy || store.description.en}
          </p>
        )}
        <Link
          href={`/store/${slug}/products`}
          className="mt-8 inline-flex items-center gap-2 rounded-none border-2 border-white bg-transparent px-8 py-3 text-sm font-extrabold uppercase tracking-widest text-white hover:bg-white transition-colors"
          style={{ '--hover-text': primary } as React.CSSProperties}
        >
          Shop Now →
        </Link>
      </div>

      {categories.length > 0 && (
        <div className="bg-gray-50 px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/store/${slug}/products?category=${cat.slug}`}
                  className="group flex flex-col items-center justify-center rounded-none border-2 border-gray-900 bg-white p-6 text-center font-extrabold uppercase text-xs tracking-widest text-gray-900 transition-all hover:bg-gray-900 hover:text-white"
                >
                  {cat.name.hy || cat.name.en}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-10">
        {featuredProducts.length > 0 && (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between border-b-4 border-gray-900 pb-3">
              <h2 className="text-lg font-extrabold uppercase tracking-widest text-gray-900">New Arrivals</h2>
              <Link
                href={`/store/${slug}/products`}
                className="text-xs font-extrabold uppercase tracking-widest text-gray-500 hover:text-gray-900"
              >
                View All →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {featuredProducts.map((product) => (
                <div key={product.uuid} className="w-48 flex-shrink-0 sm:w-56">
                  <ProductCard product={product} storeSlug={slug} isPreview={isPreview} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-6 flex items-center justify-between border-b-4 border-gray-900 pb-3">
            <h2 className="text-lg font-extrabold uppercase tracking-widest text-gray-900">All Products</h2>
          </div>
          <ProductGrid products={products} storeSlug={slug} isPreview={isPreview} />
        </section>
      </div>
    </div>
  )
}
