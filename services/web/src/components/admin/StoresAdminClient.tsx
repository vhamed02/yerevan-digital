'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreVertical, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import AdminTable from './AdminTable'
import ApproveStoreDialog from './ApproveStoreDialog'
import SuspendDialog from './SuspendDialog'
import DeleteDialog from './DeleteDialog'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'
import type { AdminStore, PaginatedResponse } from '@/types'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
]

interface StoresAdminClientProps {
  initialData: AdminStore[]
  initialMeta?: PaginatedResponse<AdminStore>['meta']
}

export default function StoresAdminClient({ initialData, initialMeta }: StoresAdminClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [approveTarget, setApproveTarget] = useState<AdminStore | null>(null)
  const [suspendTarget, setSuspendTarget] = useState<AdminStore | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminStore | null>(null)

  const status = searchParams.get('status') ?? ''
  const search = searchParams.get('search') ?? ''

  const { data, isFetching } = useQuery({
    queryKey: ['admin-stores', status, search],
    queryFn: async () => {
      const params = new URLSearchParams({ per_page: '20' })
      if (status) params.set('status', status)
      if (search) params.set('search', search)
      const res = await api.get<PaginatedResponse<AdminStore>>(`/admin/stores?${params.toString()}`)
      return res.data
    },
    initialData: initialMeta ? { data: initialData, meta: initialMeta } : undefined,
    staleTime: 30000,
  })

  const featureMutation = useMutation({
    mutationFn: ({ id, featured }: { id: number; featured: boolean }) =>
      api.patch(`/admin/stores/${id}`, { is_featured: featured }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
      toast.success('Store updated')
    },
    onError: () => toast.error('Failed to update store'),
  })

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  const columns: ColumnDef<AdminStore>[] = [
    {
      id: 'store',
      header: 'Store',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.logo_url ? (
            <img
              src={row.original.logo_url}
              alt={row.original.name.hy}
              className="h-8 w-8 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-xs font-bold text-brand-500">
              {(row.original.name.hy || row.original.name.en).charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <Link
              href={`/admin/stores/${row.original.slug}`}
              className="font-medium text-content-primary hover:text-brand-500 transition-colors"
            >
              {row.original.name.hy || row.original.name.en}
            </Link>
            <p className="text-xs text-content-muted">/{row.original.slug}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'seller',
      header: 'Seller',
      cell: ({ row }) =>
        row.original.seller ? (
          <Link
            href={`/admin/sellers/${row.original.seller.id}`}
            className="text-sm text-brand-500 hover:underline"
          >
            {row.original.seller.name}
          </Link>
        ) : (
          <span className="text-sm text-content-muted">—</span>
        ),
    },
    {
      accessorKey: 'template',
      header: 'Template',
      cell: ({ row }) => (
        <span className="text-sm text-content-secondary">
          {row.original.template?.name ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'product_count',
      header: 'Products',
      cell: ({ row }) => <span className="text-sm">{row.original.product_count}</span>,
    },
    {
      accessorKey: 'order_count',
      header: 'Orders',
      cell: ({ row }) => <span className="text-sm">{row.original.order_count}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'featured',
      header: 'Featured',
      cell: ({ row }) => (
        <button
          onClick={() =>
            featureMutation.mutate({
              id: row.original.id,
              featured: !row.original.is_featured,
            })
          }
          className={cn(
            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
            row.original.is_featured ? 'bg-brand-500' : 'bg-border'
          )}
          aria-label="Toggle featured"
        >
          <span
            className={cn(
              'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
              row.original.is_featured ? 'translate-x-[18px]' : 'translate-x-[3px]'
            )}
          />
        </button>
      ),
      size: 80,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.status === 'pending' && (
            <>
              <button
                onClick={() => setApproveTarget(row.original)}
                className="flex h-7 w-7 items-center justify-center rounded bg-status-success/10 text-status-success hover:bg-status-success/20 transition-colors"
                title="Approve"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setSuspendTarget(row.original)}
                className="flex h-7 w-7 items-center justify-center rounded bg-status-error/10 text-status-error hover:bg-status-error/20 transition-colors"
                title="Reject"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="rounded p-1 text-content-muted hover:bg-surface-secondary hover:text-content-primary transition-colors"
                aria-label="More actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[160px] rounded-lg border border-border bg-surface p-1 shadow-lg"
                align="end"
                sideOffset={4}
              >
                <DropdownMenu.Item asChild>
                  <Link
                    href={`/admin/stores/${row.original.slug}`}
                    className="flex cursor-pointer items-center rounded px-3 py-2 text-sm text-content-primary hover:bg-surface-secondary outline-none"
                  >
                    View Detail
                  </Link>
                </DropdownMenu.Item>
                {row.original.status !== 'pending' && (
                  <DropdownMenu.Item
                    className="flex cursor-pointer items-center rounded px-3 py-2 text-sm text-content-primary hover:bg-surface-secondary outline-none"
                    onSelect={() => setSuspendTarget(row.original)}
                  >
                    {row.original.status === 'suspended' ? 'Activate' : 'Suspend'}
                  </DropdownMenu.Item>
                )}
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center rounded px-3 py-2 text-sm text-status-error hover:bg-red-50 outline-none"
                  onSelect={() => setDeleteTarget(row.original)}
                >
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      ),
      size: 100,
    },
  ]

  const toolbar = (
    <input
      type="search"
      placeholder="Search stores..."
      defaultValue={search}
      className="h-9 w-60 rounded-md border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      onChange={(e) => setParam('search', e.target.value)}
    />
  )

  const pendingCount = data?.data.filter((s) => s.status === 'pending').length ?? 0

  return (
    <>
      <div className="flex flex-col gap-6">
        <h1 className="font-heading text-2xl font-bold text-content-primary">Stores</h1>

        <Tabs.Root
          value={status}
          onValueChange={(v) => setParam('status', v)}
        >
          <Tabs.List className="flex gap-1 border-b border-border">
            {TABS.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors',
                  'border-b-2 -mb-px',
                  'data-[state=active]:border-brand-500 data-[state=active]:text-brand-500',
                  'data-[state=inactive]:border-transparent data-[state=inactive]:text-content-muted data-[state=inactive]:hover:text-content-primary'
                )}
              >
                {tab.label}
                {tab.value === 'pending' && pendingCount > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <div className="mt-4 rounded-xl border border-border bg-surface p-5">
            <AdminTable
              columns={columns}
              data={data?.data ?? []}
              loading={isFetching}
              toolbar={toolbar}
            />
          </div>
        </Tabs.Root>
      </div>

      <ApproveStoreDialog
        storeId={approveTarget?.id ?? null}
        storeName={approveTarget?.name.hy || approveTarget?.name.en || ''}
        onClose={() => setApproveTarget(null)}
        invalidateKey={['admin-stores']}
      />
      <SuspendDialog
        targetId={suspendTarget?.id ?? null}
        targetName={suspendTarget?.name.hy || suspendTarget?.name.en || ''}
        targetType="store"
        currentStatus={suspendTarget?.status}
        onClose={() => setSuspendTarget(null)}
        invalidateKey={['admin-stores']}
      />
      <DeleteDialog
        targetId={deleteTarget?.id ?? null}
        targetName={deleteTarget?.name.hy || deleteTarget?.name.en || ''}
        targetType="store"
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => router.refresh()}
        invalidateKey={['admin-stores']}
      />
    </>
  )
}
