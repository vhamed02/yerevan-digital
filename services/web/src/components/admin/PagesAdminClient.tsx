'use client'
// v2
import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Globe, FileText, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import SlidePanel from './SlidePanel'
import { ConfirmModal } from '@/components/ui/Modal'
import api from '@/lib/api'
import type { Page } from '@/types'

const SLUG_LABELS: Record<string, string> = {
  about: 'About Us',
  contact: 'Contact',
  terms: 'Terms of Use',
  privacy: 'Privacy Policy',
}

const PROTECTED_SLUGS = ['about', 'contact', 'terms', 'privacy']

interface PagesAdminClientProps {
  initialPages: Page[]
}

export default function PagesAdminClient({ initialPages }: PagesAdminClientProps) {
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null)
  const [newSlug, setNewSlug] = useState('')
  const [newTitleHy, setNewTitleHy] = useState('')
  const [newTitleEn, setNewTitleEn] = useState('')

  const { data: pages } = useQuery({
    queryKey: ['admin-pages'],
    queryFn: async () => {
      const res = await api.get<Page[]>('/admin/pages')
      return res.data
    },
    initialData: initialPages,
    staleTime: 60000,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/admin/pages', {
        slug: newSlug,
        title: { hy: newTitleHy, en: newTitleEn },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] })
      toast.success('Page created')
      setCreating(false)
      setNewSlug('')
      setNewTitleHy('')
      setNewTitleEn('')
    },
    onError: () => toast.error('Failed to create page'),
  })

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => api.delete(`/admin/pages/${slug}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] })
      toast.success('Page deleted')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Failed to delete page'),
  })

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-content-primary">Pages</h1>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Page
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pages.map((page) => (
            <div
              key={page.slug}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
                  <FileText className="h-4 w-4 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium text-content-primary">
                    {SLUG_LABELS[page.slug] ?? page.title?.en ?? page.slug}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-content-muted">
                    <Globe className="h-3 w-3" />
                    /{page.slug}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/pages/${page.slug}`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </Link>
                {!PROTECTED_SLUGS.includes(page.slug) && (
                  <button
                    onClick={() => setDeleteTarget(page)}
                    className="rounded p-1.5 text-content-muted hover:text-status-error transition-colors"
                    aria-label="Delete page"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <SlidePanel
        open={creating}
        onOpenChange={(open) => !open && setCreating(false)}
        title="New Page"
        description="Create a new content page. You'll be taken to the editor after creation."
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate() }}
        >
          <Input
            label="Slug (URL path)"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="my-page"
            required
          />
          <Input
            label="Title (Armenian)"
            value={newTitleHy}
            onChange={(e) => setNewTitleHy(e.target.value)}
            required
          />
          <Input
            label="Title (English)"
            value={newTitleEn}
            onChange={(e) => setNewTitleEn(e.target.value)}
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
              Create
            </Button>
          </div>
        </form>
      </SlidePanel>

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Page"
        message={`Delete "/${deleteTarget?.slug}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.slug)}
      />
    </>
  )
}
