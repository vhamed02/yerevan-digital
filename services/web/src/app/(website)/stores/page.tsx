import { Suspense } from 'react'
import type { Metadata } from 'next'
import StoreCard from '@/components/website/StoreCard'
import StoreFilters from '@/components/website/StoreFilters'
import StorePagination from '@/components/website/StorePagination'
import { serverGet } from '@/lib/server-api'
import type { PublicStore, PublicCategory, PaginatedResponse } from '@/types'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Browse Stores — Vendora',
  description: 'Discover Armenian online stores on Vendora.',
}

interface PageProps {
  searchParams: Promise<{ category?: string; sort?: string; page?: string }>
}

export default async function StoresPage({ searchParams }: PageProps) {
  const { category, sort = 'newest', page = '1' } = await searchParams

  const params = new URLSearchParams({ sort, page, per_page: '9' })
  if (category) params.set('category', category)

  const [storesData, categoriesData] = await Promise.all([
    serverGet<PaginatedResponse<PublicStore>>(`/stores?${params.toString()}`, {
      next: { revalidate: 60 },
    }),
    serverGet<PublicCategory[]>('/categories', { next: { revalidate: 3600 } }),
  ])

  const stores = storesData?.data ?? []
  const meta = storesData?.meta
  const categories = categoriesData ?? []
  const currentPage = meta?.current_page ?? 1
  const lastPage = meta?.last_page ?? 1

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-heading text-3xl font-bold text-content-primary">Browse Stores</h1>

      <div className="flex flex-col gap-8 lg:flex-row">
        <Suspense>
          <StoreFilters
            categories={categories}
            currentCategory={category}
            currentSort={sort}
          />
        </Suspense>

        <div className="flex flex-1 flex-col gap-8">
          {stores.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-border text-content-muted">
              No stores found
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}

          <Suspense>
            <StorePagination currentPage={currentPage} lastPage={lastPage} />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
