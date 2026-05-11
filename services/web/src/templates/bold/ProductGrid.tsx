'use client'

import { ProductCard } from './ProductCard'
import type { ProductGridProps } from '../types'

export function ProductGrid({ products, storeSlug, isPreview }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400">
        <p className="text-lg font-bold uppercase tracking-widest">No products found</p>
      </div>
    )
  }

  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 space-y-4">
      {products.map((product) => (
        <div key={product.uuid} className="break-inside-avoid">
          <ProductCard product={product} storeSlug={storeSlug} isPreview={isPreview} />
        </div>
      ))}
    </div>
  )
}
