'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronDown, ChevronRight, Plus, Pencil, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import SlidePanel from './SlidePanel'
import DeleteDialog from './DeleteDialog'
import api from '@/lib/api'
import type { AdminCategory } from '@/types'
import { cn } from '@/lib/utils'

interface CategoriesAdminClientProps {
  initialCategories: AdminCategory[]
}

interface CategoryFormData {
  name_hy: string
  name_en: string
  parent_id: number | null
  icon: string
  sort_order: number
}

const emptyForm: CategoryFormData = {
  name_hy: '',
  name_en: '',
  parent_id: null,
  icon: '',
  sort_order: 0,
}

function categoryToForm(cat: AdminCategory): CategoryFormData {
  return {
    name_hy: cat.name.hy,
    name_en: cat.name.en,
    parent_id: cat.parent_id ?? null,
    icon: cat.icon ?? '',
    sort_order: cat.sort_order,
  }
}

interface CategoryRowProps {
  category: AdminCategory
  depth: number
  dragOver: number | null
  onDragStart: (id: number) => void
  onDragOver: (id: number) => void
  onDrop: (targetId: number) => void
  onEdit: (cat: AdminCategory) => void
  onDelete: (cat: AdminCategory) => void
  onToggleActive: (cat: AdminCategory) => void
}

function CategoryRow({
  category,
  depth,
  dragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onEdit,
  onDelete,
  onToggleActive,
}: CategoryRowProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = (category.children?.length ?? 0) > 0

  return (
    <>
      <tr
        draggable
        onDragStart={() => onDragStart(category.id)}
        onDragOver={(e) => { e.preventDefault(); onDragOver(category.id) }}
        onDrop={() => onDrop(category.id)}
        className={cn(
          'hover:bg-surface-secondary transition-colors',
          dragOver === category.id && 'bg-brand-50'
        )}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-1" style={{ paddingLeft: depth * 20 }}>
            <GripVertical className="h-4 w-4 cursor-grab text-content-muted" />
            {hasChildren ? (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="flex items-center"
                aria-label={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4 text-content-muted" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-content-muted" />
                )}
              </button>
            ) : (
              <span className="w-4" />
            )}
            <span className="ml-1 text-lg">{category.icon}</span>
            <span className="ml-1 text-sm font-medium text-content-primary">
              {category.name.hy || category.name.en}
            </span>
            {category.name.en && category.name.hy && (
              <span className="ml-1 text-xs text-content-muted">/ {category.name.en}</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-content-muted">{category.product_count}</td>
        <td className="px-4 py-3 text-sm text-content-muted">{category.sort_order}</td>
        <td className="px-4 py-3">
          <button
            onClick={() => onToggleActive(category)}
            className={cn(
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
              category.is_active ? 'bg-brand-500' : 'bg-border'
            )}
            aria-label="Toggle active"
          >
            <span
              className={cn(
                'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                category.is_active ? 'translate-x-[18px]' : 'translate-x-[3px]'
              )}
            />
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(category)}
              className="rounded p-1 text-content-muted hover:bg-surface-secondary hover:text-content-primary transition-colors"
              aria-label="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(category)}
              className="rounded p-1 text-content-muted hover:bg-red-50 hover:text-status-error transition-colors"
              aria-label="Delete"
            >
              ×
            </button>
          </div>
        </td>
      </tr>
      {expanded &&
        category.children?.map((child) => (
          <CategoryRow
            key={child.id}
            category={child}
            depth={depth + 1}
            dragOver={dragOver}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleActive={onToggleActive}
          />
        ))}
    </>
  )
}

export default function CategoriesAdminClient({ initialCategories }: CategoriesAdminClientProps) {
  const queryClient = useQueryClient()
  const [panelOpen, setPanelOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminCategory | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null)
  const [form, setForm] = useState<CategoryFormData>(emptyForm)
  const [dragId, setDragId] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await api.get<AdminCategory[]>('/admin/categories')
      return res.data
    },
    initialData: initialCategories,
    staleTime: 60000,
  })

  const saveMutation = useMutation({
    mutationFn: (payload: CategoryFormData) => {
      const body = {
        name: { hy: payload.name_hy, en: payload.name_en },
        parent_id: payload.parent_id,
        icon: payload.icon,
        sort_order: payload.sort_order,
      }
      return editTarget
        ? api.patch(`/admin/categories/${editTarget.id}`, body)
        : api.post('/admin/categories', body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      toast.success(editTarget ? 'Category updated' : 'Category created')
      setPanelOpen(false)
      setEditTarget(null)
      setForm(emptyForm)
    },
    onError: () => toast.error('Failed to save category'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (cat: AdminCategory) =>
      api.patch(`/admin/categories/${cat.id}`, { is_active: !cat.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    },
    onError: () => toast.error('Failed to update category'),
  })

  const reorderMutation = useMutation({
    mutationFn: ({ id, targetId }: { id: number; targetId: number }) =>
      api.post('/admin/categories/reorder', { id, after_id: targetId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
    onError: () => toast.error('Failed to reorder'),
  })

  function openCreate() {
    setEditTarget(null)
    setForm(emptyForm)
    setPanelOpen(true)
  }

  function openEdit(cat: AdminCategory) {
    setEditTarget(cat)
    setForm(categoryToForm(cat))
    setPanelOpen(true)
  }

  function handleDrop(targetId: number) {
    if (dragId !== null && dragId !== targetId) {
      reorderMutation.mutate({ id: dragId, targetId })
    }
    setDragId(null)
    setDragOver(null)
  }

  const topLevel = categories.filter((c) => !c.parent_id)

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-content-primary">Categories</h1>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary">
              <tr>
                {['Name', 'Products', 'Sort Order', 'Active', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-content-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topLevel.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-content-muted">
                    No categories yet
                  </td>
                </tr>
              ) : (
                topLevel.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    depth={0}
                    dragOver={dragOver}
                    onDragStart={setDragId}
                    onDragOver={setDragOver}
                    onDrop={handleDrop}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                    onToggleActive={(c) => toggleActiveMutation.mutate(c)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SlidePanel
        open={panelOpen}
        onOpenChange={(open) => {
          setPanelOpen(open)
          if (!open) { setEditTarget(null); setForm(emptyForm) }
        }}
        title={editTarget ? 'Edit Category' : 'Add Category'}
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate(form)
          }}
        >
          <Input
            label="Armenian Name"
            value={form.name_hy}
            onChange={(e) => setForm((f) => ({ ...f, name_hy: e.target.value }))}
            required
          />
          <Input
            label="English Name"
            value={form.name_en}
            onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-primary">
              Parent Category
            </label>
            <select
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.parent_id ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  parent_id: e.target.value ? parseInt(e.target.value) : null,
                }))
              }
            >
              <option value="">Top Level</option>
              {categories
                .filter((c) => !c.parent_id && c.id !== editTarget?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name.hy || c.name.en}
                  </option>
                ))}
            </select>
          </div>
          <Input
            label="Icon (emoji)"
            value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            placeholder="🛍️"
          />
          <Input
            label="Sort Order"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPanelOpen(false)}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editTarget ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </SlidePanel>

      <DeleteDialog
        targetId={deleteTarget?.id ?? null}
        targetName={deleteTarget?.name.hy || deleteTarget?.name.en || ''}
        targetType="category"
        onClose={() => setDeleteTarget(null)}
        invalidateKey={['admin-categories']}
      />
    </>
  )
}
