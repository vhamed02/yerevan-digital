'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { useLocale } from 'next-intl'
import { pickLang } from '@/lib/i18n'
import type { PublicCategory } from '@/types'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'products', label: 'Most Products' },
]

interface StoreFiltersProps {
  categories: PublicCategory[]
  currentCategory?: string
  currentSort?: string
}

export default function StoreFilters({ categories, currentCategory, currentSort = 'newest' }: StoreFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = useLocale()

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const toggleCategory = (id: string) => {
    updateParam('category', currentCategory === id ? null : id)
  }

  return (
    <aside className="flex w-full flex-col gap-6 lg:w-64 lg:shrink-0">
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-4 font-heading font-semibold text-content-primary">Sort By</h3>
        <select
          value={currentSort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="h-10 w-full rounded border border-border bg-surface px-3 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Sort stores"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {categories.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 font-heading font-semibold text-content-primary">Categories</h3>
          <div className="flex flex-col gap-2">
            {categories.map((cat) => {
              const id = String(cat.id)
              return (
                <label key={cat.id} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={currentCategory === id}
                    onChange={() => toggleCategory(id)}
                    className="h-4 w-4 rounded border-border text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-content-secondary">{pickLang(cat.name, locale)}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </aside>
  )
}
