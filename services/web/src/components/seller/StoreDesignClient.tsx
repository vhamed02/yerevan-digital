'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import TemplateSelector from './TemplateSelector'
import StorePreviewFrame from './StorePreviewFrame'
import api from '@/lib/api'
import useAuthStore from '@/stores/auth.store'
import type { SellerTemplate, StoreDesignSettings } from '@/types'

const PRESET_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#22c55e', '#06b6d4', '#0ea5e9']

const FONT_PAIRS = [
  { key: 'jakarta_inter', label: 'Plus Jakarta Sans + Inter', description: 'Modern' },
  { key: 'playfair_lato', label: 'Playfair Display + Lato', description: 'Elegant' },
  { key: 'montserrat_opensans', label: 'Montserrat + Open Sans', description: 'Bold' },
  { key: 'baskerville_source', label: 'Libre Baskerville + Source Sans Pro', description: 'Classic' },
]

const PRODUCTS_PER_ROW = [2, 3, 4]

const DEFAULT_DESIGN: StoreDesignSettings = {
  template_id: 0,
  primary_color: '#6366f1',
  secondary_color: '#8b5cf6',
  font_pair: 'jakarta_inter',
  products_per_row: 3,
  show_hero_banner: true,
  show_categories_bar: true,
}

interface StoreDesignClientProps {
  templates: SellerTemplate[]
  initialDesign: StoreDesignSettings | null
}

export default function StoreDesignClient({ templates, initialDesign }: StoreDesignClientProps) {
  const { sellerStore } = useAuthStore()
  const queryClient = useQueryClient()
  const [design, setDesign] = useState<StoreDesignSettings>(initialDesign ?? DEFAULT_DESIGN)
  const [previewId, setPreviewId] = useState<number | null>(design.template_id || null)
  const [confirmApply, setConfirmApply] = useState<number | null>(null)
  const [previewParams, setPreviewParams] = useState<Record<string, string>>({})

  const updatePreview = useCallback(() => {
    const template = templates.find((t) => t.id === previewId)
    setPreviewParams({
      primary: design.primary_color,
      secondary: design.secondary_color,
      font: design.font_pair,
      ...(template ? { template: template.key } : {}),
    })
  }, [design, previewId, templates])

  useEffect(() => {
    const timer = setTimeout(updatePreview, 500)
    return () => clearTimeout(timer)
  }, [updatePreview])

  function applyTemplate(id: number) {
    setDesign((d) => ({ ...d, template_id: id }))
    setPreviewId(id)
    setConfirmApply(null)
  }

  const saveMutation = useMutation({
    mutationFn: () => api.patch('/seller/store/design', design),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-design'] })
      toast.success('Design saved')
    },
    onError: () => toast.error('Failed to save design'),
  })

  const storeSlug = sellerStore?.slug ?? 'preview'

  return (
    <>
      <div className="-mx-4 -my-6 flex h-[calc(100vh-64px)] sm:-mx-6 lg:-mx-8">
        <div className="flex w-72 shrink-0 flex-col border-r border-border bg-surface overflow-y-auto">
          <div className="flex flex-col gap-5 p-5 pb-24">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">Template</p>
              <TemplateSelector
                templates={templates}
                selectedId={design.template_id}
                previewId={previewId}
                onSelect={(id) => setConfirmApply(id)}
                onPreview={(id) => setPreviewId(id)}
              />
              {previewId !== null && previewId !== design.template_id && (
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setConfirmApply(previewId)}
                >
                  Apply Template
                </Button>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">Colors</p>
              <div className="flex flex-col gap-3">
                {(['primary_color', 'secondary_color'] as const).map((field) => (
                  <div key={field} className="flex flex-col gap-1.5">
                    <label className="text-sm text-content-secondary capitalize">
                      {field === 'primary_color' ? 'Primary Color' : 'Secondary Color'}
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setDesign((d) => ({ ...d, [field]: color }))}
                          className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${design[field] === color ? 'ring-2 ring-offset-1 ring-brand-500' : ''}`}
                          style={{ backgroundColor: color }}
                          aria-label={color}
                        />
                      ))}
                      <div className="relative h-6 w-6">
                        <input
                          type="color"
                          value={design[field]}
                          onChange={(e) => setDesign((d) => ({ ...d, [field]: e.target.value }))}
                          className="absolute inset-0 h-full w-full cursor-pointer rounded-full opacity-0"
                        />
                        <div
                          className="h-6 w-6 rounded-full border-2 border-dashed border-border"
                          style={{ backgroundColor: design[field] }}
                        />
                      </div>
                      <span className="text-xs font-mono text-content-muted">{design[field]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">Font Pair</p>
              <div className="flex flex-col gap-2">
                {FONT_PAIRS.map((fp) => (
                  <label key={fp.key} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="font-pair"
                      checked={design.font_pair === fp.key}
                      onChange={() => setDesign((d) => ({ ...d, font_pair: fp.key }))}
                      className="h-3.5 w-3.5 accent-brand-500"
                    />
                    <div>
                      <span className="text-sm text-content-primary">{fp.label}</span>
                      <span className="ml-1.5 text-xs text-content-muted">({fp.description})</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">Layout</p>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="mb-1.5 text-sm text-content-secondary">Products per row</p>
                  <div className="flex gap-1">
                    {PRODUCTS_PER_ROW.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setDesign((d) => ({ ...d, products_per_row: n }))}
                        className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                          design.products_per_row === n
                            ? 'border-brand-500 bg-brand-500 text-white'
                            : 'border-border text-content-secondary hover:border-brand-300'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                {(['show_hero_banner', 'show_categories_bar'] as const).map((field) => (
                  <label key={field} className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm text-content-secondary">
                      {field === 'show_hero_banner' ? 'Show hero banner' : 'Show categories bar'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDesign((d) => ({ ...d, [field]: !d[field] }))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${design[field] ? 'bg-brand-500' : 'bg-border'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${design[field] ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                    </button>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-border bg-surface p-4">
            <Button className="w-full" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
              Save Design
            </Button>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <StorePreviewFrame storeSlug={storeSlug} previewParams={previewParams} />
        </div>
      </div>

      <ConfirmModal
        open={confirmApply !== null}
        onOpenChange={(open) => !open && setConfirmApply(null)}
        title="Apply Template"
        message="This will change your store's look. You can change back anytime."
        confirmLabel="Apply Template"
        onConfirm={() => confirmApply !== null && applyTemplate(confirmApply)}
      />
    </>
  )
}
