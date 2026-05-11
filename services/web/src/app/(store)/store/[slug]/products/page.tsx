import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { serverGet } from '@/lib/server-api'
import { loadTemplate } from '@/lib/templates'
import type { StorefrontStore, StorefrontProduct, PublicCategory } from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await serverGet<{ data: StorefrontStore }>(`/store/${slug}/info`)
  const store = data?.data
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
  const sort = sp.sort ?? 'newest'
  const page = Number(sp.page ?? 1)
  const isPreview = sp.preview === 'true'

  const queryParams = new URLSearchParams({
    ...(category ? { category } : {}),
    sort,
    page: String(page),
    per_page: '24',
  })

  const [storeData, productsData, categoriesData] = await Promise.all([
    serverGet<{ data: StorefrontStore }>(`/store/${slug}/info`),
    serverGet<{
      data: StorefrontProduct[]
      meta: { current_page: number; last_page: number; total: number }
    }>(`/store/${slug}/products?${queryParams}`),
    serverGet<{ data: PublicCategory[] }>(`/store/${slug}/categories`),
  ])

  if (!storeData?.data) notFound()
  const store = storeData.data
  const products = productsData?.data ?? []
  const categories = categoriesData?.data ?? []
  const meta = productsData?.meta

  const Template = await loadTemplate(store.active_template_key)

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low → High' },
    { value: 'price_desc', label: 'Price: High → Low' },
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
            All
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

        <select
          defaultValue={sort}
          onChange={(e) => {
            const url = new URL(window.location.href)
            url.searchParams.set('sort', e.target.value)
            window.location.href = url.toString()
          }}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          suppressHydrationWarning
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {meta && (
        <p className="mb-4 text-sm text-gray-500">
          {meta.total} product{meta.total !== 1 ? 's' : ''}
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
              ← Prev
            </Link>
          )}
          <span className="text-sm text-gray-500">
            Page {page} of {meta.last_page}
          </span>
          {page < meta.last_page && (
            <Link
              href={`/store/${slug}/products?${new URLSearchParams({ ...sp, page: String(page + 1) })}`}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
