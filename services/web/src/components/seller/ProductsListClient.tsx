'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, MoreVertical, Copy, Archive, Trash2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import AdminTable from '@/components/admin/AdminTable'
import { ConfirmModal } from '@/components/ui/Modal'
import api from '@/lib/api'
import type { SellerProduct, PublicCategory, PaginatedResponse } from '@/types'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
]

interface ProductsListClientProps {
  initialData: SellerProduct[]
  initialMeta?: PaginatedResponse<SellerProduct>['meta']
  categories: PublicCategory[]
}

export default function ProductsListClient({ initialData, initialMeta, categories }: ProductsListClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<SellerProduct | null>(null)
  const [bulkAction, setBulkAction] = useState<'archive' | 'delete' | 'activate' | null>(null)

  const status = searchParams.get('status') ?? ''
  const search = searchParams.get('search') ?? ''
  const category = searchParams.get('category') ?? ''

  const { data, isFetching } = useQuery({
    queryKey: ['seller-products', status, search, category],
    queryFn: async () => {
      const params = new URLSearchParams({ per_page: '15' })
      if (status) params.set('status', status)
      if (search) params.set('search', search)
      if (category) params.set('category', category)
      const res = await api.get<PaginatedResponse<SellerProduct>>(`/seller/products?${params.toString()}`)
      return res.data
    },
    initialData: initialMeta ? { data: initialData, meta: initialMeta } : undefined,
    staleTime: 30000,
  })

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => api.delete(`/seller/products/${uuid}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      toast.success('Product deleted')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Failed to delete'),
  })

  const duplicateMutation = useMutation({
    mutationFn: (uuid: string) => api.post(`/seller/products/${uuid}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      toast.success('Product duplicated')
    },
    onError: () => toast.error('Failed to duplicate'),
  })

  const bulkMutation = useMutation({
    mutationFn: ({ action, uuids }: { action: string; uuids: string[] }) =>
      api.post('/seller/products/bulk', { action, uuids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      toast.success('Done')
      setSelectedIds([])
      setBulkAction(null)
    },
    onError: () => toast.error('Bulk action failed'),
  })

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  const columns: ColumnDef<SellerProduct>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="rounded border-border"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded border-border"
        />
      ),
      size: 40,
    },
    {
      id: 'product',
      header: 'Product',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.images?.[0] ? (
            <img
              src={row.original.images[0].thumbnail}
              alt=""
              className="h-10 w-10 rounded-lg object-cover border border-border"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-secondary text-content-muted text-xs">
              📦
            </div>
          )}
          <Link
            href={`/seller/products/${row.original.uuid}`}
            className="font-medium text-content-primary hover:text-brand-500 transition-colors"
          >
            {row.original.name.hy || row.original.name.en}
          </Link>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-sm text-content-secondary">
          {row.original.category?.name.hy || row.original.category?.name.en || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price (֏)',
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.price.toLocaleString()} ֏</span>
      ),
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => (
        <span className={`text-sm ${row.original.stock === 0 && row.original.manage_stock ? 'text-status-error font-medium' : ''}`}>
          {row.original.manage_stock ? row.original.stock : '∞'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="rounded p-1 text-content-muted hover:bg-surface-secondary hover:text-content-primary transition-colors"
              aria-label="Actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[150px] rounded-lg border border-border bg-surface p-1 shadow-lg"
              align="end"
              sideOffset={4}
            >
              <DropdownMenu.Item asChild>
                <Link
                  href={`/seller/products/${row.original.uuid}`}
                  className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-content-primary hover:bg-surface-secondary outline-none"
                >
                  Edit
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-content-primary hover:bg-surface-secondary outline-none"
                onSelect={() => duplicateMutation.mutate(row.original.uuid)}
              >
                <Copy className="h-3.5 w-3.5" />
                Duplicate
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-content-primary hover:bg-surface-secondary outline-none"
                onSelect={() => bulkMutation.mutate({ action: 'archive', uuids: [row.original.uuid] })}
              >
                <Archive className="h-3.5 w-3.5" />
                Archive
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-status-error hover:bg-red-50 outline-none"
                onSelect={() => setDeleteTarget(row.original)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      ),
      size: 48,
    },
  ]

  const toolbar = (
    <>
      <input
        type="search"
        placeholder="Search products..."
        defaultValue={search}
        className="h-9 w-56 rounded-md border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        onChange={(e) => setParam('search', e.target.value)}
      />
      <select
        className="h-9 rounded-md border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        value={category}
        onChange={(e) => setParam('category', e.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={String(c.id)}>{c.name.hy || c.name.en}</option>
        ))}
      </select>
      <Link href="/seller/products/new" className="ml-auto">
        <Button size="sm">
          <Plus className="h-3.5 w-3.5" />
          Add Product
        </Button>
      </Link>
    </>
  )

  const products = data?.data ?? []

  return (
    <>
      <div className="flex flex-col gap-6">
        <h1 className="font-heading text-2xl font-bold text-content-primary">Products</h1>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary px-4 py-2.5">
            <span className="text-sm text-content-secondary">{selectedIds.length} selected</span>
            <Button size="sm" variant="outline" onClick={() => setBulkAction('activate')}>Activate</Button>
            <Button size="sm" variant="outline" onClick={() => setBulkAction('archive')}>Archive</Button>
            <Button size="sm" variant="destructive" onClick={() => setBulkAction('delete')}>Delete</Button>
          </div>
        )}

        <Tabs.Root value={status} onValueChange={(v) => setParam('status', v)}>
          <Tabs.List className="flex gap-0 border-b border-border">
            {STATUS_TABS.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  'data-[state=active]:border-brand-500 data-[state=active]:text-brand-500',
                  'data-[state=inactive]:border-transparent data-[state=inactive]:text-content-muted data-[state=inactive]:hover:text-content-primary'
                )}
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <div className="mt-4 rounded-xl border border-border bg-surface p-5">
            <AdminTable columns={columns} data={products} loading={isFetching} toolbar={toolbar} />
          </div>
        </Tabs.Root>
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Product"
        message={`Delete "${deleteTarget?.name.hy || deleteTarget?.name.en}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.uuid)}
      />

      <ConfirmModal
        open={bulkAction !== null}
        onOpenChange={(open) => !open && setBulkAction(null)}
        title={bulkAction === 'delete' ? 'Delete Products' : bulkAction === 'archive' ? 'Archive Products' : 'Activate Products'}
        message={`${bulkAction === 'delete' ? 'Delete' : bulkAction === 'archive' ? 'Archive' : 'Activate'} ${selectedIds.length} selected products?`}
        confirmLabel={bulkAction ?? 'Confirm'}
        destructive={bulkAction === 'delete'}
        loading={bulkMutation.isPending}
        onConfirm={() => bulkAction && bulkMutation.mutate({ action: bulkAction, uuids: selectedIds })}
      />
    </>
  )
}
