'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronLeft, Save, Search, X, Loader2, Check } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'
import type { AdminSeller } from '@/types'
import { cn } from '@/lib/utils'

const TEMPLATES = [
  { key: 'minimal', label: 'Minimal', description: 'Clean & simple' },
  { key: 'spark', label: 'Spark', description: 'Modern & vibrant' },
]

const CURRENCIES = ['AMD', 'USD', 'EUR', 'RUB']

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
]

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').slice(0, 100)
}

function SellerSelect({
  value,
  onChange,
  error,
}: {
  value: AdminSeller | null
  onChange: (s: AdminSeller | null) => void
  error?: string
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AdminSeller[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const res = await api.get<{ data: AdminSeller[] }>(`/admin/sellers?search=${encodeURIComponent(q)}&per_page=8`)
      setResults(res.data.data ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 300)
    return () => clearTimeout(t)
  }, [query, search])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  if (value) {
    return (
      <div className={cn('flex items-center justify-between rounded-lg border bg-surface px-4 py-3', error ? 'border-status-error' : 'border-brand-500 bg-brand-50/50')}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-sm font-bold text-brand-500">
            {value.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-content-primary">{value.name}</p>
            <p className="text-xs text-content-muted">{value.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-md p-1.5 text-content-muted hover:bg-surface-secondary hover:text-content-primary transition-colors"
          aria-label="Remove seller"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className={cn('flex items-center rounded-lg border bg-surface transition-colors focus-within:ring-2 focus-within:ring-brand-500', error ? 'border-status-error' : 'border-border focus-within:border-brand-500')}>
        <Search className="ml-3 h-4 w-4 shrink-0 text-content-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setOpen(true); if (query) search(query) }}
          placeholder="Search sellers by name or email…"
          className="h-10 flex-1 bg-transparent px-3 text-sm text-content-primary placeholder:text-content-muted focus:outline-none"
        />
        {loading && <Loader2 className="mr-3 h-4 w-4 shrink-0 animate-spin text-content-muted" />}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
          {results.map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(s); setQuery(''); setOpen(false) }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-secondary transition-colors border-b border-border/50 last:border-0"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-bold text-brand-500">
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-content-primary">{s.name}</p>
                <p className="truncate text-xs text-content-muted">{s.email}</p>
              </div>
              {s.store_count > 0 && (
                <span className="shrink-0 rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-content-muted">
                  {s.store_count} store{s.store_count !== 1 ? 's' : ''}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {open && !loading && query.trim() && results.length === 0 && (
        <div className="absolute z-20 mt-1.5 w-full rounded-lg border border-border bg-surface px-4 py-3 shadow-xl">
          <p className="text-sm text-content-muted">No sellers found for "{query}"</p>
        </div>
      )}
    </div>
  )
}

export default function CreateStoreClient() {
  const router = useRouter()

  const [seller, setSeller] = useState<AdminSeller | null>(null)
  const [nameHy, setNameHy] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [descHy, setDescHy] = useState('')
  const [descEn, setDescEn] = useState('')
  const [status, setStatus] = useState<'active' | 'pending'>('active')
  const [template, setTemplate] = useState('minimal')
  const [color, setColor] = useState('#6366f1')
  const [currency, setCurrency] = useState('AMD')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(nameEn))
  }, [nameEn, slugTouched])

  function validate() {
    const e: Record<string, string> = {}
    if (!seller) e.seller = 'Select a seller'
    if (!nameHy.trim()) e['name.hy'] = 'Required'
    if (!nameEn.trim()) e['name.en'] = 'Required'
    if (!slug.trim()) e.slug = 'Required'
    else if (!/^[a-z0-9-]+$/.test(slug)) e.slug = 'Only lowercase letters, numbers and hyphens'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/admin/stores', {
        seller_id: seller!.id,
        name: { hy: nameHy, en: nameEn },
        slug,
        status,
        active_template_key: template,
        primary_color: color,
        currency,
        description: { hy: descHy, en: descEn },
      }),
    onSuccess: (res) => {
      toast.success('Store created')
      router.push(`/admin/stores/${res.data.slug}`)
    },
    onError: (err: any) => {
      const data = err?.response?.data
      if (data?.errors) {
        const flat: Record<string, string> = {}
        for (const [k, v] of Object.entries(data.errors)) {
          flat[k] = Array.isArray(v) ? (v[0] as string) : String(v)
        }
        setErrors(flat)
        toast.error('Please fix the errors below')
      } else {
        toast.error(data?.message ?? 'Failed to create store')
      }
    },
  })

  function handleSave() {
    if (validate()) mutation.mutate()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-content-muted">
          <Link href="/admin/stores" className="hover:text-content-primary transition-colors flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Stores
          </Link>
          <span>/</span>
          <span className="text-content-primary">New Store</span>
        </div>
        <Button onClick={handleSave} loading={mutation.isPending}>
          <Save className="h-4 w-4" />
          Create Store
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="flex flex-col gap-5">

          {/* Names */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-content-muted">Store Name</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-content-primary">
                  <span className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px] text-content-muted">HY</span>
                  Armenian <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  value={nameHy}
                  onChange={(e) => setNameHy(e.target.value)}
                  placeholder="Խանութի անուն"
                  className={cn(
                    'h-10 w-full rounded-lg border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500',
                    errors['name.hy'] ? 'border-status-error' : 'border-border focus:border-brand-500'
                  )}
                />
                {errors['name.hy'] && <p className="text-xs text-status-error">{errors['name.hy']}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-content-primary">
                  <span className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px] text-content-muted">EN</span>
                  English <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Store name"
                  className={cn(
                    'h-10 w-full rounded-lg border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500',
                    errors['name.en'] ? 'border-status-error' : 'border-border focus:border-brand-500'
                  )}
                />
                {errors['name.en'] && <p className="text-xs text-status-error">{errors['name.en']}</p>}
              </div>
            </div>
          </div>

          {/* Slug */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-content-muted">URL Slug</h2>
            <div className="flex flex-col gap-1.5">
              <div className={cn(
                'flex overflow-hidden rounded-lg border bg-surface focus-within:ring-2 focus-within:ring-brand-500',
                errors.slug ? 'border-status-error' : 'border-border focus-within:border-brand-500'
              )}>
                <span className="border-r border-border bg-surface-secondary px-3 py-2.5 text-xs text-content-muted shrink-0">
                  yerevan.digital/store/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }}
                  placeholder="my-store"
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm text-content-primary focus:outline-none"
                />
              </div>
              {errors.slug ? (
                <p className="text-xs text-status-error">{errors.slug}</p>
              ) : (
                <p className="text-xs text-content-muted">Auto-generated from English name. Only lowercase letters, numbers and hyphens.</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-content-muted">Description <span className="normal-case font-normal text-content-muted">(optional)</span></h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 text-xs text-content-muted">
                  <span className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px]">HY</span>
                  Armenian
                </label>
                <textarea
                  rows={4}
                  value={descHy}
                  onChange={(e) => setDescHy(e.target.value)}
                  placeholder="Խանութի համառոտ նկարագրություն..."
                  className="resize-none rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 text-xs text-content-muted">
                  <span className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px]">EN</span>
                  English
                </label>
                <textarea
                  rows={4}
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  placeholder="Short description of the store..."
                  className="resize-none rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">

          {/* Seller */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-muted">Seller <span className="text-status-error">*</span></h2>
            <SellerSelect value={seller} onChange={setSeller} error={errors.seller} />
            {errors.seller && <p className="mt-1.5 text-xs text-status-error">{errors.seller}</p>}
          </div>

          {/* Status */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-muted">Status</h2>
            <div className="flex flex-col gap-2">
              {(['active', 'pending'] as const).map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-surface-secondary has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50/50">
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="accent-brand-500"
                  />
                  <div>
                    <p className="text-sm font-medium capitalize text-content-primary">{s}</p>
                    <p className="text-xs text-content-muted">
                      {s === 'active' ? 'Visible and open for orders' : 'Hidden, awaiting review'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Template */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-muted">Template</h2>
            <div className="flex flex-col gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTemplate(t.key)}
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors',
                    template === t.key
                      ? 'border-brand-500 bg-brand-50/50'
                      : 'border-border hover:bg-surface-secondary'
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-content-primary">{t.label}</p>
                    <p className="text-xs text-content-muted">{t.description}</p>
                  </div>
                  {template === t.key && <Check className="h-4 w-4 text-brand-500 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-muted">Primary Color</h2>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-7 w-7 rounded-full transition-transform hover:scale-110',
                    color === c && 'ring-2 ring-offset-2 ring-brand-500'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <div className="relative h-7 w-7">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer rounded-full opacity-0"
                />
                <div
                  className="h-7 w-7 rounded-full border-2 border-dashed border-border"
                  style={{ backgroundColor: color }}
                  title="Custom color"
                />
              </div>
            </div>
            <p className="mt-2 font-mono text-xs text-content-muted">{color}</p>
          </div>

          {/* Currency */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-muted">Currency</h2>
            <div className="grid grid-cols-2 gap-2">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={cn(
                    'flex items-center justify-center rounded-lg border py-2 text-sm font-medium transition-colors',
                    currency === c
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-border text-content-secondary hover:border-brand-300 hover:bg-surface-secondary'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
