'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import {
  ChevronLeft, Save, Eye, EyeOff,
  Bold, Italic, UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Minus, Undo, Redo,
  Heading1, Heading2, Heading3,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import api from '@/lib/api'
import type { Page } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  page: Page
}

type Lang = 'hy' | 'en'

export default function PageEditorClient({ page }: Props) {
  const [lang, setLang] = useState<Lang>('hy')
  const [published, setPublished] = useState(page.is_published)
  const [titleHy, setTitleHy] = useState(page.title.hy ?? '')
  const [titleEn, setTitleEn] = useState(page.title.en ?? '')
  const [metaTitleHy, setMetaTitleHy] = useState(page.meta_title?.hy ?? '')
  const [metaTitleEn, setMetaTitleEn] = useState(page.meta_title?.en ?? '')
  const [metaDescHy, setMetaDescHy] = useState(page.meta_description?.hy ?? '')
  const [metaDescEn, setMetaDescEn] = useState(page.meta_description?.en ?? '')

  const editorHy = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Start writing in Armenian…' }),
    ],
    content: page.content.hy ?? '',
    editorProps: {
      attributes: { class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] text-content-primary' },
    },
  })

  const editorEn = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Start writing in English…' }),
    ],
    content: page.content.en ?? '',
    editorProps: {
      attributes: { class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] text-content-primary' },
    },
  })

  const activeEditor = lang === 'hy' ? editorHy : editorEn

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put(`/admin/pages/${page.slug}`, {
        title: { hy: titleHy, en: titleEn },
        content: { hy: editorHy?.getHTML() ?? '', en: editorEn?.getHTML() ?? '' },
        meta_title: { hy: metaTitleHy, en: metaTitleEn },
        meta_description: { hy: metaDescHy, en: metaDescEn },
        is_published: published,
      }),
    onSuccess: () => toast.success('Page saved'),
    onError: () => toast.error('Failed to save'),
  })

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
  }, [activeEditor, lang])

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pages"
            className="flex items-center gap-1 text-sm text-content-muted hover:text-content-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Pages
          </Link>
          <span className="text-content-muted">/</span>
          <span className="text-sm font-medium text-content-primary">/{page.slug}</span>
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
        {/* Main editor area */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Language tabs */}
          <div className="flex border-b border-border bg-surface px-5">
            {(['hy', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={cn(
                  'flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium -mb-px transition-colors',
                  lang === l
                    ? 'border-brand-500 text-brand-500'
                    : 'border-transparent text-content-muted hover:text-content-primary'
                )}
              >
                {l === 'hy' ? '🇦🇲 Armenian' : '🇬🇧 English'}
              </button>
            ))}
          </div>

          <div className="mx-auto w-full max-w-3xl px-6 py-8">
            {/* Title */}
            <input
              type="text"
              value={lang === 'hy' ? titleHy : titleEn}
              onChange={(e) => lang === 'hy' ? setTitleHy(e.target.value) : setTitleEn(e.target.value)}
              placeholder="Page title"
              className="mb-6 w-full border-none bg-transparent font-heading text-3xl font-bold text-content-primary placeholder:text-content-muted/40 focus:outline-none"
            />

            {/* Editor */}
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              {toolbar()}
              <div className="px-5 py-4">
                <div className={lang === 'hy' ? 'block' : 'hidden'}>
                  <EditorContent editor={editorHy} />
                </div>
                <div className={lang === 'en' ? 'block' : 'hidden'}>
                  <EditorContent editor={editorEn} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-72 shrink-0 overflow-y-auto border-l border-border bg-surface">
          <div className="flex flex-col gap-5 p-5">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">Page Info</p>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-content-muted">Slug</span>
                  <span className="font-medium text-content-primary">/{page.slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">Status</span>
                  <span className={cn('font-medium', published ? 'text-status-success' : 'text-content-muted')}>
                    {published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">Updated</span>
                  <span className="text-content-secondary">
                    {new Date(page.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">
                SEO — {lang === 'hy' ? 'Armenian' : 'English'}
              </p>
              <div className="flex flex-col gap-3">
                <Input
                  label="Meta Title"
                  value={lang === 'hy' ? metaTitleHy : metaTitleEn}
                  onChange={(e) =>
                    lang === 'hy' ? setMetaTitleHy(e.target.value) : setMetaTitleEn(e.target.value)
                  }
                />
                <Textarea
                  label="Meta Description"
                  value={lang === 'hy' ? metaDescHy : metaDescEn}
                  onChange={(e) =>
                    lang === 'hy' ? setMetaDescHy(e.target.value) : setMetaDescEn(e.target.value)
                  }
                  rows={3}
                />
                {(lang === 'hy' ? metaTitleHy : metaTitleEn) && (
                  <div className="rounded-lg border border-border bg-surface-secondary p-3 text-xs">
                    <p className="truncate font-medium text-blue-600">{lang === 'hy' ? titleHy : titleEn}</p>
                    <p className="mt-0.5 truncate text-green-700">radif.org/{page.slug}</p>
                    <p className="mt-1 line-clamp-2 text-content-secondary">
                      {lang === 'hy' ? metaDescHy : metaDescEn}
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
