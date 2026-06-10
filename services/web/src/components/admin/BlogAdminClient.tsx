'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2, Newspaper, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import SlidePanel from './SlidePanel'
import { ConfirmModal } from '@/components/ui/Modal'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import type { AdminPostListItem, PaginatedResponse, Post } from '@/types'

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
] as const

interface BlogAdminClientProps {
  initialPosts: PaginatedResponse<AdminPostListItem>
}

export default function BlogAdminClient({ initialPosts }: BlogAdminClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminPostListItem | null>(null)
  const [newTitleEn, setNewTitleEn] = useState('')

  const { data: posts } = useQuery({
    queryKey: ['admin-posts', status, search, page],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<AdminPostListItem>>('/admin/posts', {
        params: {
          ...(status ? { status } : {}),
          ...(search ? { search } : {}),
          page,
        },
      })
      return res.data
    },
    initialData: status === '' && search === '' && page === 1 ? initialPosts : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30000,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<Post>('/admin/posts', {
        title: { en: newTitleEn },
        content: { en: '<p></p>' },
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
      setCreating(false)
      setNewTitleEn('')
      router.push(`/admin/blog/${res.data.slug}`)
    },
    onError: () => toast.error('Failed to create post'),
  })

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => api.delete(`/admin/posts/${slug}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
      toast.success('Post deleted')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Failed to delete post'),
  })

  const items = posts?.data ?? []
  const meta = posts?.meta

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-content-primary">Blog</h1>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Post
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-lg border border-border bg-surface p-0.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setStatus(tab.key); setPage(1) }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  status === tab.key
                    ? 'bg-brand-500 text-white'
                    : 'text-content-muted hover:text-content-primary'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-content-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search posts…"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-content-primary placeholder:text-content-muted focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
            <Newspaper className="h-8 w-8 text-content-muted" />
            <p className="text-sm text-content-muted">
              {status || search ? 'No posts match your filters.' : 'No posts yet. Write your first one!'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-secondary text-left text-xs uppercase tracking-wider text-content-muted">
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Published</th>
                  <th className="px-5 py-3 font-semibold">Author</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((post) => (
                  <tr key={post.id} className="border-b border-border-light last:border-0 hover:bg-surface-secondary/50">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/blog/${post.slug}`} className="font-medium text-content-primary hover:text-brand-600">
                        {post.title.en || post.title.hy || post.slug}
                      </Link>
                      <p className="text-xs text-content-muted">/blog/{post.slug}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                          post.status === 'published'
                            ? 'bg-status-success/10 text-status-success'
                            : 'bg-surface-tertiary text-content-secondary'
                        )}
                      >
                        {post.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-content-secondary">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-content-secondary">{post.author_name}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/blog/${post.slug}`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(post)}
                          className="rounded p-1.5 text-content-muted transition-colors hover:text-status-error"
                          aria-label="Delete post"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between text-sm text-content-muted">
            <span>
              Page {meta.current_page} of {meta.last_page} · {meta.total} posts
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <SlidePanel
        open={creating}
        onOpenChange={(open) => !open && setCreating(false)}
        title="New Post"
        description="Give your post an English title — the URL is generated from it. You'll write the content in the editor."
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate() }}
        >
          <Input
            label="Title (English)"
            value={newTitleEn}
            onChange={(e) => setNewTitleEn(e.target.value)}
            placeholder="How to start selling online in Armenia"
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreating(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create & Edit
            </Button>
          </div>
        </form>
      </SlidePanel>

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Post"
        message={`Delete "${deleteTarget?.title.en ?? deleteTarget?.slug}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.slug)}
      />
    </>
  )
}
