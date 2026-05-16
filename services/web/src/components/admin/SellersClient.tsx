'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { MoreVertical, Download, Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import AdminTable from './AdminTable'
import SuspendDialog from './SuspendDialog'
import DeleteDialog from './DeleteDialog'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'
import type { AdminSeller, PaginatedResponse } from '@/types'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

interface SellersClientProps {
  initialData: AdminSeller[]
  initialMeta?: PaginatedResponse<AdminSeller>['meta']
}

export default function SellersClient({ initialData, initialMeta }: SellersClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [suspendTarget, setSuspendTarget] = useState<AdminSeller | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminSeller | null>(null)

  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''

  const { data, isFetching } = useQuery({
    queryKey: ['admin-sellers', search, status],
    queryFn: async () => {
      const params = new URLSearchParams({ per_page: '20' })
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      const res = await api.get<PaginatedResponse<AdminSeller>>(`/admin/sellers?${params.toString()}`)
      return res.data
    },
    initialData: initialMeta ? { data: initialData, meta: initialMeta } : undefined,
    staleTime: 30000,
  })

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  const columns: ColumnDef<AdminSeller>[] = [
    {
      id: 'seller',
      header: 'Seller',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-sm font-semibold text-brand-500">
            {row.original.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-content-primary">{row.original.name}</p>
            <p className="text-xs text-content-muted">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'store',
      header: 'Store',
      cell: ({ row }) =>
        row.original.store ? (
          <Link
            href={`/admin/stores/${row.original.store.slug}`}
            className="text-sm text-brand-500 hover:underline"
          >
            {row.original.store.name.hy || row.original.store.name.en}
          </Link>
        ) : (
          <span className="text-sm text-content-muted">—</span>
        ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'product_count',
      header: 'Products',
      cell: ({ row }) => <span className="text-sm">{row.original.product_count ?? 0}</span>,
    },
    {
      accessorKey: 'total_revenue',
      header: 'Revenue',
      cell: ({ row }) => (
        <span className="text-sm">{(row.original.total_revenue ?? 0).toLocaleString()} ֏</span>
      ),
    },
    {
      accessorKey: 'joined_at',
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-sm text-content-muted">
          {new Date(row.original.joined_at).toLocaleDateString()}
        </span>
      ),
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
                  href={`/admin/sellers/${row.original.id}`}
                  className="flex cursor-pointer items-center rounded px-3 py-2 text-sm text-content-primary hover:bg-surface-secondary outline-none"
                >
                  View Profile
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex cursor-pointer items-center rounded px-3 py-2 text-sm text-content-primary hover:bg-surface-secondary outline-none"
                onSelect={() => setSuspendTarget(row.original)}
              >
                {row.original.status === 'suspended' ? 'Activate' : 'Suspend'}
              </DropdownMenu.Item>
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
      ),
      size: 48,
    },
  ]

  const toolbar = (
    <>
      <input
        type="search"
        placeholder="Search sellers..."
        defaultValue={search}
        className="h-9 w-60 rounded-md border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        onChange={(e) => setParam('search', e.target.value)}
      />
      <select
        className="h-9 rounded-md border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        value={status}
        onChange={(e) => setParam('status', e.target.value)}
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
      </select>
      <div className="ml-auto">
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>
    </>
  )

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-content-primary">Sellers</h1>
          <Link href="/admin/sellers/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Seller
            </Button>
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <AdminTable
            columns={columns}
            data={data?.data ?? []}
            loading={isFetching}
            toolbar={toolbar}
          />
        </div>
      </div>

      <SuspendDialog
        targetId={suspendTarget?.id ?? null}
        targetName={suspendTarget?.name ?? ''}
        targetType="seller"
        currentStatus={suspendTarget?.status}
        onClose={() => setSuspendTarget(null)}
        invalidateKey={['admin-sellers']}
      />
      <DeleteDialog
        targetId={deleteTarget?.id ?? null}
        targetName={deleteTarget?.name ?? ''}
        targetType="seller"
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => router.refresh()}
        invalidateKey={['admin-sellers']}
      />
    </>
  )
}
