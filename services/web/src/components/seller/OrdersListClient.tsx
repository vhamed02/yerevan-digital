'use client'

import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import AdminTable from '@/components/admin/AdminTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'
import type { Order, PaginatedResponse } from '@/types'
import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

interface OrdersListClientProps {
  initialData: Order[]
  initialMeta?: PaginatedResponse<Order>['meta']
}

export default function OrdersListClient({ initialData, initialMeta }: OrdersListClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const status = searchParams.get('status') ?? ''

  const { data, isFetching } = useQuery({
    queryKey: ['seller-orders', status],
    queryFn: async () => {
      const params = new URLSearchParams({ per_page: '20' })
      if (status) params.set('status', status)
      const res = await api.get<PaginatedResponse<Order>>(`/seller/orders?${params.toString()}`)
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

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'order_number',
      header: 'Order #',
      cell: ({ row }) => (
        <span className="font-medium text-content-primary">{row.original.order_number}</span>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-content-primary">{row.original.customer_name}</p>
          <p className="text-xs text-content-muted">{row.original.customer_email}</p>
        </div>
      ),
    },
    {
      id: 'items',
      header: 'Items',
      cell: ({ row }) => (
        <span className="text-sm text-content-secondary">{row.original.items?.length ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Total (֏)',
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.total.toLocaleString()} ֏</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-content-muted">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'view',
      header: '',
      cell: ({ row }) => (
        <Link href={`/seller/orders/${row.original.uuid}`}>
          <Button variant="outline" size="sm">View</Button>
        </Link>
      ),
      size: 60,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold text-content-primary">Orders</h1>

      <Tabs.Root value={status} onValueChange={(v) => setParam('status', v)}>
        <Tabs.List className="flex gap-0 border-b border-border overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                'data-[state=active]:border-brand-500 data-[state=active]:text-brand-500',
                'data-[state=inactive]:border-transparent data-[state=inactive]:text-content-muted data-[state=inactive]:hover:text-content-primary'
              )}
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="mt-4 rounded-xl border border-border bg-surface p-5">
          <AdminTable columns={columns} data={data?.data ?? []} loading={isFetching} />
        </div>
      </Tabs.Root>
    </div>
  )
}
