import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import StoreCard from './StoreCard'
import type { PublicStore, PaginatedResponse } from '@/types'
import { serverGet } from '@/lib/server-api'

export default async function FeaturedStores() {
  const data = await serverGet<PaginatedResponse<PublicStore>>('/stores?featured=1&per_page=6', {
    next: { revalidate: 3600 },
  })

  const stores = data?.data ?? []

  if (stores.length === 0) return null

  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-heading text-3xl font-bold text-content-primary">Active Stores</h2>
          <Link
            href="/stores"
            className="flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
          >
            Explore All Stores
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      </div>
    </section>
  )
}
