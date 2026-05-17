'use client'

import { ProductCard } from './ProductCard'
import type { ProductGridProps } from '../types'

export function ProductGrid({ products, storeSlug, isPreview }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-gray-400">
        <p className="text-lg">Ապրանք չի գտնվել</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
