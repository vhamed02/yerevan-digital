import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { serverGet } from '@/lib/server-api'
import { loadTemplate } from '@/lib/templates'
import { SortSelect } from '@/components/store/SortSelect'
import { PriceRangeFilter } from '@/components/store/PriceRangeFilter'
import { SearchInput } from '@/components/store/SearchInput'
import type { StorefrontStore, StorefrontProduct, PublicCategory } from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const store = await serverGet<StorefrontStore>(`/store/${slug}/info`)
  if (!store) return {}
  const name = store.name.hy || store.name.en
  return { title: `Products — ${name} | Vendora` }
}

export default async function StoreProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { slug } = await params
  const sp = await searchParams

  const category = sp.category ?? ''
  const sort     = sp.sort ?? 'newest'
  const page     = Number(sp.page ?? 1)
  const isPreview = sp.preview === 'true'
  const minPrice = sp.min_price ?? ''
  const maxPrice = sp.max_price ?? ''
  const search   = sp.search ?? ''
  const inStock  = sp.in_stock ?? ''
  const onSale   = sp.on_sale ?? ''
  const featured = sp.featured ?? ''

  const queryParams = new URLSearchParams({
    ...(category ? { category } : {}),
    sort,
    page: String(page),
    per_page: '24',
    ...(minPrice  ? { min_price: minPrice }   : {}),
    ...(maxPrice  ? { max_price: maxPrice }   : {}),
    ...(search    ? { search }                : {}),
    ...(inStock   ? { in_stock: inStock }     : {}),
    ...(onSale    ? { on_sale: onSale }       : {}),
    ...(featured  ? { featured }              : {}),
  })

  function toggleParam(key: string): string {
    const p = new URLSearchParams(sp as Record<string, string>)
    p.delete('page')
    if (p.has(key)) p.delete(key)
    else p.set(key, '1')
    const str = p.toString()
    return `/store/${slug}/products${str ? `?${str}` : ''}`
  }

  const hasActiveFilters = !!(minPrice || maxPrice || inStock || onSale || featured)

  const [storeData, productsData, categoriesData] = await Promise.all([
    serverGet<StorefrontStore>(`/store/${slug}/info`),
    serverGet<{
      data: StorefrontProduct[]
      meta: { current_page: number; last_page: number; total: number }
    }>(`/store/${slug}/products?${queryParams}`),
    serverGet<PublicCategory[]>(`/store/${slug}/categories`),
  ])

  if (!storeData) notFound()
  const store = storeData
  const products = productsData?.data ?? []
  const categories = categoriesData ?? []
  const meta = productsData?.meta

  const Template = await loadTemplate(store.active_template_key)

  const sortOptions = [
    { value: 'newest', label: 'Նոր' },
    { value: 'price_asc', label: 'Գին: Աճման' },
    { value: 'price_desc', label: 'Գին: Նվազման' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 flex-wrap gap-2">
          <Link
            href={`/store/${slug}/products`}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              !category
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            Բոլոր
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/store/${slug}/products?category=${cat.slug}${sort !== 'newest' ? `&sort=${sort}` : ''}`}
              className={`rounded-full border px-4 py-1.5 text-sm whitespace-nowrap transition-colors ${
                category === cat.slug
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {cat.name.hy || cat.name.en}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <SearchInput storeSlug={slug} initialValue={search} />
          <SortSelect value={sort} options={sortOptions} />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3">
        <PriceRangeFilter storeSlug={slug} initialMin={minPrice} initialMax={maxPrice} />
        <div className="mx-1 h-5 w-px bg-gray-200" />
        {(
          [
            { key: 'in_stock', value: inStock,  label: 'Առկա'      },
            { key: 'on_sale',  value: onSale,   label: 'Զեղչ %'    },
            { key: 'featured', value: featured, label: 'Ուշագրավ'  },
          ] as const
        ).map(({ key, value, label }) => (
          <Link
            key={key}
            href={toggleParam(key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              value === '1'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {label}
          </Link>
        ))}
        {hasActiveFilters && (
          <Link
            href={`/store/${slug}/products${sort !== 'newest' ? `?sort=${sort}` : ''}${category ? `${sort !== 'newest' ? '&' : '?'}category=${category}` : ''}`}
            className="ml-auto rounded-full border border-gray-200 px-3.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
          >
            Մաքրել ×
          </Link>
        )}
      </div>

      {meta && (
        <p className="mb-4 text-sm text-gray-500">
          {meta.total} ապրանք
        </p>
      )}

      <Template.ProductGrid products={products} storeSlug={slug} isPreview={isPreview} />

      {meta && meta.last_page > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/store/${slug}/products?${new URLSearchParams({ ...sp, page: String(page - 1) })}`}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
            >
              ← Նախ.
            </Link>
          )}
          <span className="text-sm text-gray-500">
            Էջ {page} / {meta.last_page}
          </span>
          {page < meta.last_page && (
            <Link
              href={`/store/${slug}/products?${new URLSearchParams({ ...sp, page: String(page + 1) })}`}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Հաջ. →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
