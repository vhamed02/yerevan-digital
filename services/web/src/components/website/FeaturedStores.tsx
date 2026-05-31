import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import StoreCard from './StoreCard'
import type { PublicStore, PaginatedResponse } from '@/types'
import { serverGet } from '@/lib/server-api'

export default async function FeaturedStores() {
  const t = useTranslations('featuredStores')

  const data = await serverGet<PaginatedResponse<PublicStore>>('/stores?featured=1&per_page=6', {
    next: { revalidate: 3600 },
  })

  const stores = data?.data ?? []

  if (stores.length === 0) return null

  return (
    <section className="bg-surface-secondary py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-3 block text-sm font-medium text-brand-600">{t('label')}</span>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-content-primary sm:text-4xl">
              {t('heading')}
            </h2>
          </div>
          <Link
            href="/stores"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-content-primary/70 shadow-sm transition-all hover:border-brand-200 hover:text-brand-600 hover:shadow-md"
          >
            {t('explore')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      </div>
    </section>
  )
}
