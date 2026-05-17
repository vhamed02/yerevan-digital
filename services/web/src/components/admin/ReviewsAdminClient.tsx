'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Star, Check, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import type { AdminReview } from '@/app/(admin)/admin/reviews/page'

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </span>
  )
}

interface Props {
  initialData: AdminReview[]
  initialMeta?: { current_page: number; last_page: number; total: number }
  initialStatus: string
}

export default function ReviewsAdminClient({ initialData, initialMeta, initialStatus }: Props) {
  const router = useRouter()
  const [reviews, setReviews] = useState<AdminReview[]>(initialData)
  const [loading, setLoading] = useState<number | null>(null)
  const status = initialStatus

  function setStatus(s: string) {
    router.push(`/admin/reviews?status=${s}`)
  }

  async function approve(id: number) {
    setLoading(id)
    try {
      await api.patch(`/admin/reviews/${id}/approve`)
      setReviews((prev) => prev.filter((r) => r.id !== id))
    } finally {
      setLoading(null)
    }
  }

  async function destroy(id: number) {
    if (!confirm('Delete this review?')) return
    setLoading(id)
    try {
      await api.delete(`/admin/reviews/${id}`)
      setReviews((prev) => prev.filter((r) => r.id !== id))
    } finally {
      setLoading(null)
    }
  }

  const tabs = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'all', label: 'All' },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Product Reviews</h1>
          {initialMeta && (
            <p className="mt-0.5 text-sm text-gray-500">{initialMeta.total} total</p>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              status === t.value
                ? 'bg-gray-900 text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
          No reviews found
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{r.reviewer_name}</span>
                    {r.reviewer_email && (
                      <span className="text-xs text-gray-400">{r.reviewer_email}</span>
                    )}
                    <Stars value={r.rating} />
                    <time className="text-xs text-gray-400">{r.created_at}</time>
                    {r.is_approved && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Approved
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    {r.store.name.hy || r.store.name.en} →{' '}
                    <span className="text-gray-600">{r.product.name.hy || r.product.name.en}</span>
                  </p>
                  {r.body && (
                    <p className="text-sm text-gray-700 leading-relaxed">{r.body}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {!r.is_approved && (
                    <button
                      onClick={() => approve(r.id)}
                      disabled={loading === r.id}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => destroy(r.id)}
                    disabled={loading === r.id}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
