'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import {
  ChevronLeft, Save, Eye, EyeOff, ImagePlus, X,
  Bold, Italic, UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Minus, Undo, Redo,
  Heading1, Heading2, Heading3,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import api from '@/lib/api'
import type { Post, PostCover } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  post: Post
}

type Lang = 'hy' | 'en' | 'ru'
const LANG_TABS: Lang[] = ['hy', 'en', 'ru']
const LANG_NAMES: Record<Lang, string> = { hy: 'Armenian', en: 'English', ru: 'Russian' }
const LANG_FLAGS: Record<Lang, string> = { hy: '🇦🇲 Armenian', en: '🇬🇧 English', ru: '🇷🇺 Russian' }

const editorClass =
  'prose prose-sm max-w-none focus:outline-none min-h-[400px] text-content-primary'

export default function PostEditorClient({ post }: Props) {
  const [lang, setLang] = useState<Lang>('en')
  const [published, setPublished] = useState(post.status === 'published')
  const [cover, setCover] = useState<PostCover | null>(post.cover ?? null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [authorName, setAuthorName] = useState(post.author_name ?? 'Vendorex')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [titleHy, setTitleHy] = useState(post.title.hy ?? '')
  const [titleEn, setTitleEn] = useState(post.title.en ?? '')
  const [titleRu, setTitleRu] = useState(post.title.ru ?? '')
  const [excerptHy, setExcerptHy] = useState(post.excerpt?.hy ?? '')
  const [excerptEn, setExcerptEn] = useState(post.excerpt?.en ?? '')
  const [excerptRu, setExcerptRu] = useState(post.excerpt?.ru ?? '')
  const [metaTitleHy, setMetaTitleHy] = useState(post.meta_title?.hy ?? '')
  const [metaTitleEn, setMetaTitleEn] = useState(post.meta_title?.en ?? '')
  const [metaTitleRu, setMetaTitleRu] = useState(post.meta_title?.ru ?? '')
  const [metaDescHy, setMetaDescHy] = useState(post.meta_description?.hy ?? '')
  const [metaDescEn, setMetaDescEn] = useState(post.meta_description?.en ?? '')
  const [metaDescRu, setMetaDescRu] = useState(post.meta_description?.ru ?? '')

  const editorHy = useEditor({
    extensions: [StarterKit, Underline, Placeholder.configure({ placeholder: 'Start writing in Armenian…' })],
    content: post.content.hy ?? '',
    editorProps: { attributes: { class: editorClass } },
  })

  const editorEn = useEditor({
    extensions: [StarterKit, Underline, Placeholder.configure({ placeholder: 'Start writing in English…' })],
    content: post.content.en ?? '',
    editorProps: { attributes: { class: editorClass } },
  })

  const editorRu = useEditor({
    extensions: [StarterKit, Underline, Placeholder.configure({ placeholder: 'Start writing in Russian…' })],
    content: post.content.ru ?? '',
    editorProps: { attributes: { class: editorClass } },
  })

  const editors = { hy: editorHy, en: editorEn, ru: editorRu }
  const title = { hy: titleHy, en: titleEn, ru: titleRu }
  const setTitle = { hy: setTitleHy, en: setTitleEn, ru: setTitleRu }
  const excerpt = { hy: excerptHy, en: excerptEn, ru: excerptRu }
  const setExcerpt = { hy: setExcerptHy, en: setExcerptEn, ru: setExcerptRu }
  const metaTitle = { hy: metaTitleHy, en: metaTitleEn, ru: metaTitleRu }
  const setMetaTitle = { hy: setMetaTitleHy, en: setMetaTitleEn, ru: setMetaTitleRu }
  const metaDesc = { hy: metaDescHy, en: metaDescEn, ru: metaDescRu }
  const setMetaDesc = { hy: setMetaDescHy, en: setMetaDescEn, ru: setMetaDescRu }

  const activeEditor = editors[lang]

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put<Post>(`/admin/posts/${post.slug}`, {
        title: { hy: titleHy, en: titleEn, ru: titleRu },
        excerpt: { hy: excerptHy, en: excerptEn, ru: excerptRu },
        content: { hy: editorHy?.getHTML() ?? '', en: editorEn?.getHTML() ?? '', ru: editorRu?.getHTML() ?? '' },
        cover,
        author_name: authorName,
        status: published ? 'published' : 'draft',
        meta_title: { hy: metaTitleHy, en: metaTitleEn, ru: metaTitleRu },
        meta_description: { hy: metaDescHy, en: metaDescEn, ru: metaDescRu },
      }),
    onSuccess: () => toast.success('Post saved'),
    onError: () => toast.error('Failed to save — make sure the English title and content are filled'),
  })

  async function handleCoverFile(file: File) {
    setUploadingCover(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await api.post<PostCover>('/admin/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setCover({
        original: res.data.original,
        thumbnail: res.data.thumbnail,
        medium: res.data.medium,
        large: res.data.large,
      })
      toast.success('Cover uploaded — save the post to keep it')
    } catch {
      toast.error('Cover upload failed')
    } finally {
      setUploadingCover(false)
    }
  }

  const toolbar = useCallback(() => {
    if (!activeEditor) return null
    const btn = (action: () => void, active: boolean, icon: React.ReactNode, label: string) => (
      <button
        key={label}
        type="button"
        onMouseDown={(e) => { e.preventDefault(); action() }}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded text-sm transition-colors',
          active
            ? 'bg-brand-500 text-white'
            : 'text-content-muted hover:bg-surface-secondary hover:text-content-primary'
        )}
        title={label}
      >
        {icon}
      </button>
    )

    return (
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface px-3 py-2">
        {btn(() => activeEditor.chain().focus().toggleHeading({ level: 1 }).run(), activeEditor.isActive('heading', { level: 1 }), <Heading1 className="h-3.5 w-3.5" />, 'H1')}
        {btn(() => activeEditor.chain().focus().toggleHeading({ level: 2 }).run(), activeEditor.isActive('heading', { level: 2 }), <Heading2 className="h-3.5 w-3.5" />, 'H2')}
        {btn(() => activeEditor.chain().focus().toggleHeading({ level: 3 }).run(), activeEditor.isActive('heading', { level: 3 }), <Heading3 className="h-3.5 w-3.5" />, 'H3')}
        <div className="mx-1 h-5 w-px bg-border" />
        {btn(() => activeEditor.chain().focus().toggleBold().run(), activeEditor.isActive('bold'), <Bold className="h-3.5 w-3.5" />, 'Bold')}
        {btn(() => activeEditor.chain().focus().toggleItalic().run(), activeEditor.isActive('italic'), <Italic className="h-3.5 w-3.5" />, 'Italic')}
        {btn(() => activeEditor.chain().focus().toggleUnderline().run(), activeEditor.isActive('underline'), <UnderlineIcon className="h-3.5 w-3.5" />, 'Underline')}
        {btn(() => activeEditor.chain().focus().toggleStrike().run(), activeEditor.isActive('strike'), <Strikethrough className="h-3.5 w-3.5" />, 'Strikethrough')}
        <div className="mx-1 h-5 w-px bg-border" />
        {btn(() => activeEditor.chain().focus().toggleBulletList().run(), activeEditor.isActive('bulletList'), <List className="h-3.5 w-3.5" />, 'Bullet list')}
        {btn(() => activeEditor.chain().focus().toggleOrderedList().run(), activeEditor.isActive('orderedList'), <ListOrdered className="h-3.5 w-3.5" />, 'Ordered list')}
        {btn(() => activeEditor.chain().focus().toggleBlockquote().run(), activeEditor.isActive('blockquote'), <Quote className="h-3.5 w-3.5" />, 'Quote')}
        {btn(() => activeEditor.chain().focus().setHorizontalRule().run(), false, <Minus className="h-3.5 w-3.5" />, 'Divider')}
        <div className="mx-1 h-5 w-px bg-border" />
        {btn(() => activeEditor.chain().focus().undo().run(), false, <Undo className="h-3.5 w-3.5" />, 'Undo')}
        {btn(() => activeEditor.chain().focus().redo().run(), false, <Redo className="h-3.5 w-3.5" />, 'Redo')}
      </div>
    )
  }, [activeEditor])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog"
            className="flex items-center gap-1 text-sm text-content-muted transition-colors hover:text-content-primary"
          >
            <ChevronLeft className="h-4 w-4" />
            Blog
          </Link>
          <span className="text-content-muted">/</span>
          <span className="text-sm font-medium text-content-primary">/blog/{post.slug}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPublished((p) => !p)}
            className={cn(
              'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
              published
                ? 'border-status-success/30 bg-status-success/10 text-status-success'
                : 'border-border text-content-muted hover:text-content-primary'
            )}
          >
            {published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {published ? 'Published' : 'Draft'}
          </button>
          <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex border-b border-border bg-surface px-5">
            {LANG_TABS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={cn(
                  '-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  lang === l
                    ? 'border-brand-500 text-brand-500'
                    : 'border-transparent text-content-muted hover:text-content-primary'
                )}
              >
                {LANG_FLAGS[l]}
              </button>
            ))}
          </div>

          <div className="mx-auto w-full max-w-3xl px-6 py-8">
            <input
              type="text"
              value={title[lang]}
              onChange={(e) => setTitle[lang](e.target.value)}
              placeholder={`Post title (${LANG_NAMES[lang]})`}
              className="mb-4 w-full border-none bg-transparent font-heading text-3xl font-bold text-content-primary placeholder:text-content-muted/40 focus:outline-none"
            />

            <Textarea
              label={`Excerpt — ${LANG_NAMES[lang]} (shown in post listings and search results)`}
              value={excerpt[lang]}
              onChange={(e) => setExcerpt[lang](e.target.value)}
              rows={2}
              className="mb-6"
            />

            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              {toolbar()}
              <div className="px-5 py-4">
                <div className={lang === 'hy' ? 'block' : 'hidden'}>
                  <EditorContent editor={editorHy} />
                </div>
                <div className={lang === 'en' ? 'block' : 'hidden'}>
                  <EditorContent editor={editorEn} />
                </div>
                <div className={lang === 'ru' ? 'block' : 'hidden'}>
                  <EditorContent editor={editorRu} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-72 shrink-0 overflow-y-auto border-l border-border bg-surface">
          <div className="flex flex-col gap-5 p-5">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">Cover Image</p>
              {cover ? (
                <div className="relative overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cover.medium} alt="Cover" className="aspect-video w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCover(null)}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
                    aria-label="Remove cover"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-content-muted transition-colors hover:border-brand-500 hover:text-brand-500"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs">{uploadingCover ? 'Uploading…' : 'Upload cover'}</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleCoverFile(file)
                  e.target.value = ''
                }}
              />
            </div>

            <div className="border-t border-border pt-4">
              <Input
                label="Author"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">Post Info</p>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-content-muted">Slug</span>
                  <span className="max-w-[150px] truncate font-medium text-content-primary">/{post.slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">Status</span>
                  <span className={cn('font-medium', published ? 'text-status-success' : 'text-content-muted')}>
                    {published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">Published</span>
                  <span className="text-content-secondary">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">Updated</span>
                  <span className="text-content-secondary">
                    {new Date(post.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">
                SEO — {LANG_NAMES[lang]}
              </p>
              <div className="flex flex-col gap-3">
                <Input
                  label="Meta Title"
                  value={metaTitle[lang]}
                  onChange={(e) => setMetaTitle[lang](e.target.value)}
                />
                <Textarea
                  label="Meta Description"
                  value={metaDesc[lang]}
                  onChange={(e) => setMetaDesc[lang](e.target.value)}
                  rows={3}
                />
                {(metaTitle[lang] || title[lang]) && (
                  <div className="rounded-lg border border-border bg-surface-secondary p-3 text-xs">
                    <p className="truncate font-medium text-blue-600">{metaTitle[lang] || title[lang]}</p>
                    <p className="mt-0.5 truncate text-green-700">vendorex.shop/blog/{post.slug}</p>
                    <p className="mt-1 line-clamp-2 text-content-secondary">
                      {metaDesc[lang] || excerpt[lang]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
