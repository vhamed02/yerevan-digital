'use client'

import { ProductCard } from './ProductCard'
import type { ProductGridProps } from '../types'

export function ProductGrid({ products, storeSlug, isPreview }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-stone-400">
        <p
          className="text-lg font-semibold"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          No products found
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.uuid}
          product={product}
          storeSlug={storeSlug}
          isPreview={isPreview}
        />
      ))}
    </div>
  )
}
