'use client'

import { ShoppingBag } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ProductCard } from './ProductCard'
import type { ProductGridProps } from '../types'

export function ProductGrid({ products, storeSlug, isPreview }: ProductGridProps) {
  const t = useTranslations('storefront')
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <ShoppingBag className="h-6 w-6 text-gray-400" />
        </div>
        <div>
          <p className="font-semibold text-gray-700">{t('noProductsFound')}</p>
          <p className="mt-1 text-sm text-gray-400">{t('tryAnotherSearch')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, i) => (
        <div
          key={product.uuid}
          className={
            i === 0 && products.length >= 3
              ? 'col-span-2 sm:col-span-1 h-full'
              : 'h-full'
          }
        >
          <ProductCard product={product} storeSlug={storeSlug} isPreview={isPreview} />
        </div>
      ))}
    </div>
  )
}
