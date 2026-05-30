'use client'

import { useTranslations } from 'next-intl'
import { ProductCard } from './ProductCard'
import type { ProductGridProps } from '../types'

export function ProductGrid({ products, storeSlug, isPreview }: ProductGridProps) {
  const t = useTranslations('storefront')
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-gray-400">
        <p className="text-lg">{t('noProductsFound')}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
