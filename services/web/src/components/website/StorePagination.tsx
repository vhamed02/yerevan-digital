'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'

interface StorePaginationProps {
  currentPage: number
  lastPage: number
}

export default function StorePagination({ currentPage, lastPage }: StorePaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', String(page))
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  if (lastPage <= 1) return null

  const pages = Array.from({ length: lastPage }, (_, i) => i + 1)

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => goToPage(page)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors',
            page === currentPage
              ? 'bg-brand-500 text-white'
              : 'border border-border text-content-secondary hover:bg-surface-secondary'
          )}
          aria-label={`Page ${page}`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}
    </nav>
  )
}
