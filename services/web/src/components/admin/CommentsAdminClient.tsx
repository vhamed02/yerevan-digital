'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import type { AdminComment } from '@/app/(admin)/admin/comments/page'

interface Props {
  initialData: AdminComment[]
  initialMeta?: { current_page: number; last_page: number; total: number }
  initialStatus: string
}

export default function CommentsAdminClient({ initialData, initialMeta, initialStatus }: Props) {
  const router = useRouter()
  const [comments, setComments] = useState<AdminComment[]>(initialData)
  const [loading, setLoading] = useState<number | null>(null)
  const status = initialStatus

  function setStatus(s: string) {
    router.push(`/admin/comments?status=${s}`)
  }

  async function approve(id: number) {
    setLoading(id)
    try {
      await api.patch(`/admin/comments/${id}/approve`)
      setComments((prev) => prev.filter((c) => c.id !== id))
    } finally {
      setLoading(null)
    }
  }

  async function destroy(id: number) {
    if (!confirm('Delete this comment?')) return
    setLoading(id)
    try {
      await api.delete(`/admin/comments/${id}`)
      setComments((prev) => prev.filter((c) => c.id !== id))
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
          <h1 className="text-xl font-bold text-gray-900">Blog Comments</h1>
          {initialMeta && <p className="mt-0.5 text-sm text-gray-500">{initialMeta.total} total</p>}
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

      {comments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
          No comments found
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-semibold text-gray-900">{c.author_name}</span>
                    {c.author_email && <span className="text-xs text-gray-400">{c.author_email}</span>}
                    <time className="text-xs text-gray-400">{c.created_at}</time>
                    {c.is_approved && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Approved
                      </span>
                    )}
                  </div>
                  <p className="mb-2 text-xs text-gray-400">
                    on{' '}
                    <span className="text-gray-600">
                      {c.post?.title?.hy || c.post?.title?.en || c.post?.slug || 'post'}
                    </span>
                  </p>
                  <p className="text-sm leading-relaxed text-gray-700">{c.body}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!c.is_approved && (
                    <button
                      onClick={() => approve(c.id)}
                      disabled={loading === c.id}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => destroy(c.id)}
                    disabled={loading === c.id}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
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
