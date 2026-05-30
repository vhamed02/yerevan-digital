'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { ProductGrid } from './ProductGrid'
import { pickLang } from '@/lib/i18n'
import type { StoreHomeProps } from '../types'

export function StoreHome({
  store,
  featuredProducts,
  products,
  categories,
  slug,
  isPreview,
}: StoreHomeProps) {
  const locale = useLocale()
  const t = useTranslations('storefront')
  const name = pickLang(store.name, locale)

  return (
    <div>
      {store.banner_url && store.template_config.show_hero_banner !== false && (
        <div className="relative h-[40vh] w-full overflow-hidden bg-gray-100">
          <Image
            src={store.banner_url}
            alt={name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
            <div className="text-center">
              <h1 className="font-bold text-3xl text-white drop-shadow-md sm:text-5xl">{name}</h1>
              {store.description && (
                <p className="mt-2 text-white/90 text-sm sm:text-base">
                  {pickLang(store.description, locale)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {!store.banner_url && (
        <div className="bg-gray-50 px-4 py-12 text-center">
          <h1 className="font-bold text-3xl text-gray-900 sm:text-5xl">{name}</h1>
          {store.description && (
            <p className="mt-3 text-gray-500">
              {pickLang(store.description, locale)}
            </p>
          )}
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-8">
        {store.template_config.show_categories_bar !== false && categories.length > 0 && (
          <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
            <Link
              href={`/store/${slug}/products`}
              className="flex-shrink-0 rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors"
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/store/${slug}/products?category=${cat.slug}`}
                className="flex-shrink-0 rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors whitespace-nowrap"
              >
                {pickLang(cat.name, locale)}
              </Link>
            ))}
          </div>
        )}

        {featuredProducts.length > 0 && (
          <section className="mb-10">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{t('featuredProducts')}</h2>
              <Link
                href={`/store/${slug}/products?featured=1`}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {t('home.seeAll')} →
              </Link>
            </div>
            <ProductGrid products={featuredProducts} storeSlug={slug} isPreview={isPreview} />
          </section>
        )}

        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {featuredProducts.length > 0 ? t('allProducts') : t('home.products')}
            </h2>
            <Link
              href={`/store/${slug}/products`}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {t('home.seeAll')} →
            </Link>
          </div>
          <ProductGrid products={products} storeSlug={slug} isPreview={isPreview} />
        </section>
      </div>
    </div>
  )
}
