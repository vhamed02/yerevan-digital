'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Loader2 } from 'lucide-react'
import SlidePanel from './SlidePanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import api from '@/lib/api'
import type { AdminSeller } from '@/types'

const TEMPLATES = [
  { key: 'minimal', label: 'Minimal' },
  { key: 'bold', label: 'Bold' },
  { key: 'elegant', label: 'Elegant' },
]

const CURRENCIES = ['AMD', 'USD', 'EUR', 'RUB']

const PRESET_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#22c55e', '#06b6d4', '#0ea5e9']

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

interface CreateStorePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateStorePanel({ open, onOpenChange }: CreateStorePanelProps) {
  const queryClient = useQueryClient()

  const [sellerSearch, setSellerSearch] = useState('')
  const [sellerResults, setSellerResults] = useState<AdminSeller[]>([])
  const [sellerLoading, setSellerLoading] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState<AdminSeller | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const [nameHy, setNameHy] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [status, setStatus] = useState<'active' | 'pending'>('active')
  const [template, setTemplate] = useState('minimal')
  const [color, setColor] = useState('#6366f1')
  const [currency, setCurrency] = useState('AMD')
  const [descHy, setDescHy] = useState('')
  const [descEn, setDescEn] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(nameEn))
  }, [nameEn, slugTouched])

  const searchSellers = useCallback(async (q: string) => {
    if (!q.trim()) { setSellerResults([]); return }
    setSellerLoading(true)
    try {
      const res = await api.get<{ data: { data: AdminSeller[] } }>(`/admin/sellers?search=${encodeURIComponent(q)}&per_page=8`)
      setSellerResults(res.data.data.data ?? [])
    } catch {
      setSellerResults([])
    } finally {
      setSellerLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchSellers(sellerSearch), 300)
    return () => clearTimeout(t)
  }, [sellerSearch, searchSellers])

  function reset() {
    setSelectedSeller(null)
    setSellerSearch('')
    setSellerResults([])
    setNameHy('')
    setNameEn('')
    setSlug('')
    setSlugTouched(false)
    setStatus('active')
    setTemplate('minimal')
    setColor('#6366f1')
    setCurrency('AMD')
    setDescHy('')
    setDescEn('')
    setErrors({})
  }

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/admin/stores', {
        seller_id: selectedSeller!.id,
        name: { hy: nameHy, en: nameEn },
        slug,
        status,
        active_template_key: template,
        primary_color: color,
        currency,
        description: { hy: descHy, en: descEn },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
      toast.success('Store created')
      reset()
      onOpenChange(false)
    },
    onError: (err: any) => {
      const data = err?.response?.data
      if (data?.errors) {
        const flat: Record<string, string> = {}
        for (const [k, v] of Object.entries(data.errors)) {
          flat[k] = Array.isArray(v) ? (v[0] as string) : String(v)
        }
        setErrors(flat)
      } else {
        toast.error(data?.message ?? 'Failed to create store')
      }
    },
  })

  function validate() {
    const e: Record<string, string> = {}
    if (!selectedSeller) e.seller = 'Select a seller'
    if (!nameHy.trim()) e['name.hy'] = 'Required'
    if (!nameEn.trim()) e['name.en'] = 'Required'
    if (!slug.trim()) e.slug = 'Required'
    else if (!/^[a-z0-9-]+$/.test(slug)) e.slug = 'Only lowercase letters, numbers, hyphens'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (validate()) mutation.mutate()
  }

  return (
    <SlidePanel
      open={open}
      onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}
      title="Create Store"
      description="Set up a new store on behalf of a seller"
      width="lg"
    >
      <div className="flex flex-col gap-6 pb-4">

        {/* Seller */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-content-primary">
            Seller <span className="text-status-error">*</span>
          </label>
          {selectedSeller ? (
            <div className="flex items-center justify-between rounded-lg border border-brand-500 bg-brand-50 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-content-primary">{selectedSeller.name}</p>
                <p className="text-xs text-content-muted">{selectedSeller.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSeller(null)}
                className="text-xs text-content-muted hover:text-status-error transition-colors"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-content-muted" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={sellerSearch}
                  onChange={(e) => { setSellerSearch(e.target.value); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  className="h-10 w-full rounded border border-border bg-surface pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                {sellerLoading && (
                  <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-content-muted" />
                )}
              </div>
              {showDropdown && sellerResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg">
                  {sellerResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
                      onClick={() => { setSelectedSeller(s); setShowDropdown(false); setSellerSearch('') }}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-bold text-brand-500">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-content-primary">{s.name}</p>
                        <p className="truncate text-xs text-content-muted">{s.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {errors.seller && <p className="text-xs text-status-error">{errors.seller}</p>}
        </div>

        {/* Name */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-content-primary">
            Store Name <span className="text-status-error">*</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs text-content-muted">
                <span className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px]">HY</span>
                Armenian
              </label>
              <input
                type="text"
                value={nameHy}
                onChange={(e) => setNameHy(e.target.value)}
                placeholder="Խանութի անուն"
                className="h-10 rounded border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              {errors['name.hy'] && <p className="text-xs text-status-error">{errors['name.hy']}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs text-content-muted">
                <span className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px]">EN</span>
                English
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="Store name"
                className="h-10 rounded border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              {errors['name.en'] && <p className="text-xs text-status-error">{errors['name.en']}</p>}
            </div>
          </div>
        </div>

        {/* Slug */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-content-primary">
            URL Slug <span className="text-status-error">*</span>
          </label>
          <div className="flex items-center rounded border border-border bg-surface focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 overflow-hidden">
            <span className="border-r border-border bg-surface-secondary px-3 py-2 text-xs text-content-muted shrink-0">
              vendora.am/store/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }}
              placeholder="my-store"
              className="flex-1 bg-transparent px-3 py-2 text-sm text-content-primary focus:outline-none"
            />
          </div>
          {errors.slug && <p className="text-xs text-status-error">{errors.slug}</p>}
        </div>

        {/* Status + Template */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-content-primary">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'pending')}
              className="h-10 rounded border border-border bg-surface px-3 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-content-primary">Template</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="h-10 rounded border border-border bg-surface px-3 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              {TEMPLATES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Color + Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-content-primary">Primary Color</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-1 ring-brand-500' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <div className="relative h-6 w-6">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer rounded-full opacity-0"
                />
                <div
                  className="h-6 w-6 rounded-full border-2 border-dashed border-border"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-content-primary">Currency</label>
            <div className="flex gap-1.5">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`h-9 rounded px-3 text-sm font-medium transition-colors border ${
                    currency === c
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-border text-content-secondary hover:border-brand-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-content-primary">Description <span className="text-content-muted font-normal">(optional)</span></p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs text-content-muted">
                <span className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px]">HY</span>
                Armenian
              </label>
              <textarea
                rows={3}
                value={descHy}
                onChange={(e) => setDescHy(e.target.value)}
                placeholder="Խանութի նկարագրությունը..."
                className="resize-none rounded border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs text-content-muted">
                <span className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px]">EN</span>
                English
              </label>
              <textarea
                rows={3}
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                placeholder="Store description..."
                className="resize-none rounded border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={mutation.isPending}>
            Create Store
          </Button>
        </div>
      </div>
    </SlidePanel>
  )
}
