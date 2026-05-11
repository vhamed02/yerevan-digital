'use client'

import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { SellerVariant } from '@/types'

interface AttributeRow {
  name: string
  values: string[]
}

interface VariantEditorProps {
  variants: SellerVariant[]
  onChange: (variants: SellerVariant[]) => void
}

function generateVariants(attributes: AttributeRow[]): SellerVariant[] {
  const filtered = attributes.filter((a) => a.name && a.values.length > 0)
  if (filtered.length === 0) return []

  const combinations: Record<string, string>[] = [{}]
  for (const attr of filtered) {
    const next: Record<string, string>[] = []
    for (const combo of combinations) {
      for (const val of attr.values) {
        next.push({ ...combo, [attr.name]: val })
      }
    }
    combinations.length = 0
    combinations.push(...next)
  }

  return combinations.map((attrs) => ({
    attributes: attrs,
    price: 0,
    stock: 0,
    sku: '',
    is_active: true,
  }))
}

export default function VariantEditor({ variants, onChange }: VariantEditorProps) {
  const [enabled, setEnabled] = useState(variants.length > 0)
  const [attributes, setAttributes] = useState<AttributeRow[]>([
    { name: '', values: [] },
  ])
  const [newValueInputs, setNewValueInputs] = useState<Record<number, string>>({})

  function toggleEnabled(val: boolean) {
    setEnabled(val)
    if (!val) onChange([])
  }

  function updateAttrName(index: number, name: string) {
    const next = [...attributes]
    next[index] = { ...next[index], name }
    setAttributes(next)
  }

  function addValue(index: number) {
    const val = (newValueInputs[index] ?? '').trim()
    if (!val) return
    const next = [...attributes]
    if (!next[index].values.includes(val)) {
      next[index] = { ...next[index], values: [...next[index].values, val] }
    }
    setAttributes(next)
    setNewValueInputs((prev) => ({ ...prev, [index]: '' }))
  }

  function removeValue(attrIndex: number, valIndex: number) {
    const next = [...attributes]
    next[attrIndex] = {
      ...next[attrIndex],
      values: next[attrIndex].values.filter((_, i) => i !== valIndex),
    }
    setAttributes(next)
  }

  function addAttribute() {
    setAttributes((prev) => [...prev, { name: '', values: [] }])
  }

  function removeAttribute(index: number) {
    setAttributes((prev) => prev.filter((_, i) => i !== index))
  }

  useEffect(() => {
    if (enabled) {
      onChange(generateVariants(attributes))
    }
  }, [attributes, enabled])

  function updateVariant(index: number, field: keyof SellerVariant, value: string | number | boolean) {
    const next = [...variants]
    next[index] = { ...next[index], [field]: value }
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex cursor-pointer items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => toggleEnabled(!enabled)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? 'bg-brand-500' : 'bg-border'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
        </button>
        <span className="text-sm font-medium text-content-primary">This product has multiple variants</span>
      </label>

      {enabled && (
        <div className="flex flex-col gap-4">
          {attributes.map((attr, i) => (
            <div key={i} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex items-center gap-3">
                <Input
                  placeholder="Attribute name (e.g. Color)"
                  value={attr.name}
                  onChange={(e) => updateAttrName(i, e.target.value)}
                  className="flex-1"
                />
                {attributes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAttribute(i)}
                    className="text-content-muted hover:text-status-error transition-colors"
                    aria-label="Remove attribute"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {attr.values.map((val, vi) => (
                  <span
                    key={vi}
                    className="flex items-center gap-1 rounded-full border border-border bg-surface-secondary px-3 py-1 text-xs font-medium text-content-primary"
                  >
                    {val}
                    <button
                      type="button"
                      onClick={() => removeValue(i, vi)}
                      className="ml-1 text-content-muted hover:text-status-error"
                      aria-label={`Remove ${val}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="+ Add value"
                    value={newValueInputs[i] ?? ''}
                    onChange={(e) => setNewValueInputs((prev) => ({ ...prev, [i]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addValue(i))}
                    className="h-7 rounded-full border border-dashed border-border bg-transparent px-3 text-xs focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => addValue(i)}
                    className="text-xs text-brand-500 hover:underline"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addAttribute}>
            <Plus className="h-3.5 w-3.5" />
            Add Attribute
          </Button>

          {variants.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-secondary">
                  <tr>
                    {Object.keys(variants[0].attributes).map((k) => (
                      <th key={k} className="px-3 py-2 text-left text-xs font-medium text-content-muted capitalize">{k}</th>
                    ))}
                    {['Price (֏)', 'Stock', 'SKU', 'Active'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-medium text-content-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {variants.map((variant, vi) => (
                    <tr key={vi}>
                      {Object.values(variant.attributes).map((val, ai) => (
                        <td key={ai} className="px-3 py-2 text-xs text-content-secondary">{val}</td>
                      ))}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={variant.price || ''}
                          onChange={(e) => updateVariant(vi, 'price', parseFloat(e.target.value) || 0)}
                          className="h-7 w-24 rounded border border-border bg-surface px-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={variant.stock || ''}
                          onChange={(e) => updateVariant(vi, 'stock', parseInt(e.target.value) || 0)}
                          className="h-7 w-20 rounded border border-border bg-surface px-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={variant.sku ?? ''}
                          onChange={(e) => updateVariant(vi, 'sku', e.target.value)}
                          className="h-7 w-24 rounded border border-border bg-surface px-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={variant.is_active}
                          onChange={(e) => updateVariant(vi, 'is_active', e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-border"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
