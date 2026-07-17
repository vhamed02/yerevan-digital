'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Receipt, Clock, CheckCircle2, Ban } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { DataTable } from '@/components/ui/DataTable'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import StatCard from './StatCard'
import api from '@/lib/api'
import type { AdminInvoice, AdminInvoiceSummary, InvoiceStatus, PaginatedResponse } from '@/types'

interface InvoicesAdminClientProps {
  initialInvoices: AdminInvoice[]
  initialSummary: AdminInvoiceSummary | null
}

// Radix Select forbids an empty-string item value, so "all" is the sentinel.
type StatusFilter = 'all' | InvoiceStatus

function statusVariant(status: InvoiceStatus): 'success' | 'warning' | 'secondary' {
  if (status === 'paid') return 'success'
  if (status === 'void') return 'secondary'
  return 'warning'
}

export default function InvoicesAdminClient({
  initialInvoices,
  initialSummary,
}: InvoicesAdminClientProps) {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const { data: summary } = useQuery({
    queryKey: ['admin-invoices-summary'],
    queryFn: async () => {
      const res = await api.get<AdminInvoiceSummary>('/admin/invoices/summary')
      return res.data
    },
    initialData: initialSummary ?? undefined,
    staleTime: 30000,
  })

  const { data: invoices, isFetching } = useQuery({
    queryKey: ['admin-invoices', statusFilter],
    queryFn: async () => {
      const query = statusFilter === 'all' ? '' : `?status=${statusFilter}`
      const res = await api.get<PaginatedResponse<AdminInvoice>>(`/admin/invoices${query}`)
      return res.data.data
    },
    initialData: statusFilter === 'all' ? initialInvoices : undefined,
    staleTime: 30000,
  })

  const voidMutation = useMutation({
    mutationFn: (uuid: string) => api.post(`/admin/invoices/${uuid}/void`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['admin-invoices-summary'] })
      toast.success('Invoice voided')
    },
    onError: () => toast.error('Failed to void the invoice'),
  })

  const columns: ColumnDef<AdminInvoice>[] = [
    {
      accessorKey: 'period_start',
      header: 'Period',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-content-primary">
          {row.original.period_start} &ndash; {row.original.period_end}
        </span>
      ),
    },
    {
      accessorKey: 'store',
      header: 'Store',
      cell: ({ row }) => {
        const store = row.original.store
        if (!store) return <span className="text-content-muted">—</span>
        return (
          <Link
            href={`/admin/stores/${store.slug}`}
            className="text-sm font-medium text-brand-500 hover:underline"
          >
            {store.name.hy || store.name.en}
          </Link>
        )
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <CurrencyDisplay
          amount={Number(row.original.amount)}
          className="text-sm font-semibold text-content-primary"
        />
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)}>{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: 'paid_at',
      header: 'Paid at',
      cell: ({ row }) => (
        <span className="text-sm text-content-muted">
          {row.original.paid_at ? new Date(row.original.paid_at).toLocaleDateString('en-GB') : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        row.original.status === 'pending' ? (
          <Button
            variant="ghost"
            size="sm"
            loading={voidMutation.isPending}
            onClick={() => {
              if (confirm('Void this invoice? This cannot be undone.')) {
                voidMutation.mutate(row.original.uuid)
              }
            }}
          >
            <Ban className="h-4 w-4 text-status-error" />
          </Button>
        ) : null,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon={Clock}
          label="Outstanding"
          value={summary ? `${Number(summary.outstanding).toLocaleString('hy-AM')} ֏` : '—'}
          trend="Pending seller payments"
          color="warning"
        />
        <StatCard
          icon={CheckCircle2}
          label="Collected"
          value={summary ? `${Number(summary.paid).toLocaleString('hy-AM')} ֏` : '—'}
          trend="Paid to date"
          color="success"
        />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-content-primary">Invoices</p>
          <div className="w-44">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'paid', label: 'Paid' },
                { value: 'void', label: 'Void' },
              ]}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={invoices ?? []}
          loading={isFetching && !invoices}
          pageSize={20}
          emptyState={
            <EmptyState
              icon={Receipt}
              title="No invoices yet"
              description="Weekly commission invoices appear here once generated."
            />
          }
        />
      </div>
    </div>
  )
}
