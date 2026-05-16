'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Globe, FileText, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import SlidePanel from './SlidePanel'
import { ConfirmModal } from '@/components/ui/Modal'
import api from '@/lib/api'
import type { Page } from '@/types'
import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

interface PagesAdminClientProps {
  initialPages: Page[]
}

interface PageFormData {
  title_hy: string
  title_en: string
  content_hy: string
  content_en: string
  meta_title_hy: string
  meta_title_en: string
  meta_description_hy: string
  meta_description_en: string
}

const SLUG_LABELS: Record<string, string> = {
  about: 'About Us',
  contact: 'Contact',
  terms: 'Terms of Use',
  privacy: 'Privacy Policy',
}

const PROTECTED_SLUGS = ['about', 'contact', 'terms', 'privacy']

export default function PagesAdminClient({ initialPages }: PagesAdminClientProps) {
  const queryClient = useQueryClient()
  const [editTarget, setEditTarget] = useState<Page | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null)
  const [creating, setCreating] = useState(false)
  const [newSlug, setNewSlug] = useState('')
  const [newTitleHy, setNewTitleHy] = useState('')
  const [newTitleEn, setNewTitleEn] = useState('')
  const [tab, setTab] = useState<'hy' | 'en'>('hy')
  const [preview, setPreview] = useState(false)
  const [form, setForm] = useState<PageFormData>({
    title_hy: '', title_en: '',
    content_hy: '', content_en: '',
    meta_title_hy: '', meta_title_en: '',
    meta_description_hy: '', meta_description_en: '',
  })

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
    mutationFn: () => api.post('/admin/pages', {
      slug: newSlug,
      title: { hy: newTitleHy, en: newTitleEn },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] })
      toast.success('Page created')
      setCreating(false)
      setNewSlug(''); setNewTitleHy(''); setNewTitleEn('')
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

  const saveMutation = useMutation({
    mutationFn: (payload: PageFormData) =>
      api.put(`/admin/pages/${editTarget!.slug}`, {
        title: { hy: payload.title_hy, en: payload.title_en },
        content: { hy: payload.content_hy, en: payload.content_en },
        meta_title: { hy: payload.meta_title_hy, en: payload.meta_title_en },
        meta_description: { hy: payload.meta_description_hy, en: payload.meta_description_en },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] })
      toast.success('Page saved')
      setEditTarget(null)
    },
    onError: () => toast.error('Failed to save page'),
  })

  function openEdit(page: Page) {
    setEditTarget(page)
    setTab('hy')
    setPreview(false)
    setForm({
      title_hy: page.title.hy ?? '',
      title_en: page.title.en ?? '',
      content_hy: page.content.hy ?? '',
      content_en: page.content.en ?? '',
      meta_title_hy: page.meta_title?.hy ?? '',
      meta_title_en: page.meta_title?.en ?? '',
      meta_description_hy: page.meta_description?.hy ?? '',
      meta_description_en: page.meta_description?.en ?? '',
    })
  }

  const previewContent = tab === 'hy' ? form.content_hy : form.content_en
  const previewParagraphs = previewContent.split('\n\n').filter(Boolean)

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
                <Button variant="outline" size="sm" onClick={() => openEdit(page)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
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
        description="Create a new content page accessible at /your-slug."
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate() }}
        >
          <Input
            label="Slug (URL)"
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
            <Button type="button" variant="outline" onClick={() => setCreating(false)} disabled={createMutation.isPending}>
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

      <SlidePanel
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        title={`Edit: ${SLUG_LABELS[editTarget?.slug ?? ''] ?? editTarget?.slug}`}
        description="Changes apply to both Armenian and English versions of the page."
      >
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form) }}
        >
          <Tabs.Root value={tab} onValueChange={(v) => setTab(v as 'hy' | 'en')}>
            <div className="flex items-center justify-between">
              <Tabs.List className="flex rounded-lg border border-border bg-surface-secondary p-1">
                <Tabs.Trigger
                  value="hy"
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    'data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-content-primary',
                    'data-[state=inactive]:text-content-muted'
                  )}
                >
                  🇦🇲 Armenian
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="en"
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    'data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-content-primary',
                    'data-[state=inactive]:text-content-muted'
                  )}
                >
                  🇬🇧 English
                </Tabs.Trigger>
              </Tabs.List>
              <button
                type="button"
                onClick={() => setPreview((p) => !p)}
                className="text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
              >
                {preview ? 'Edit' : 'Preview'}
              </button>
            </div>

            <Tabs.Content value="hy" className="mt-4 flex flex-col gap-4">
              {preview ? (
                <PagePreview paragraphs={previewParagraphs} title={form.title_hy} />
              ) : (
                <>
                  <Input
                    label="Title (Armenian)"
                    value={form.title_hy}
                    onChange={(e) => setForm((f) => ({ ...f, title_hy: e.target.value }))}
                    required
                  />
                  <Textarea
                    label="Content (Armenian)"
                    value={form.content_hy}
                    onChange={(e) => setForm((f) => ({ ...f, content_hy: e.target.value }))}
                    rows={12}
                    placeholder="Separate paragraphs with a blank line..."
                  />
                </>
              )}
            </Tabs.Content>

            <Tabs.Content value="en" className="mt-4 flex flex-col gap-4">
              {preview ? (
                <PagePreview paragraphs={previewParagraphs} title={form.title_en} />
              ) : (
                <>
                  <Input
                    label="Title (English)"
                    value={form.title_en}
                    onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
                    required
                  />
                  <Textarea
                    label="Content (English)"
                    value={form.content_en}
                    onChange={(e) => setForm((f) => ({ ...f, content_en: e.target.value }))}
                    rows={12}
                    placeholder="Separate paragraphs with a blank line..."
                  />
                </>
              )}
            </Tabs.Content>
          </Tabs.Root>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">SEO ({tab === 'hy' ? 'Armenian' : 'English'})</p>
            <div className="flex flex-col gap-3">
              <Input
                label="Meta Title"
                value={tab === 'hy' ? form.meta_title_hy : form.meta_title_en}
                onChange={(e) => setForm((f) => tab === 'hy' ? { ...f, meta_title_hy: e.target.value } : { ...f, meta_title_en: e.target.value })}
              />
              <Textarea
                label="Meta Description"
                value={tab === 'hy' ? form.meta_description_hy : form.meta_description_en}
                onChange={(e) => setForm((f) => tab === 'hy' ? { ...f, meta_description_hy: e.target.value } : { ...f, meta_description_en: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              Save Page
            </Button>
          </div>
        </form>
      </SlidePanel>
    </>
  )
}

function PagePreview({ paragraphs, title }: { paragraphs: string[]; title: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-5">
      <h2 className="mb-4 font-heading text-xl font-bold text-content-primary">{title || '—'}</h2>
      <div className="flex flex-col gap-3">
        {paragraphs.length === 0 ? (
          <p className="text-sm text-content-muted">Nothing to preview yet.</p>
        ) : (
          paragraphs.map((para, i) => (
            <p key={i} className="text-sm leading-relaxed text-content-primary/70 whitespace-pre-line">
              {para}
            </p>
          ))
        )}
      </div>
    </div>
  )
}
