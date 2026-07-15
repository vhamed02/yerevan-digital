'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Coins, TrendingUp, RotateCcw, Percent } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable } from '@/components/ui/DataTable'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import StatCard from './StatCard'
import api from '@/lib/api'
import { formatRate, fractionToPercent, percentToFraction, amountToNumber } from '@/lib/commission'
import type {
  AdminCommission,
  AdminCommissionSummary,
  PaginatedResponse,
} from '@/types'

interface CommissionsAdminClientProps {
  initialLedger: AdminCommission[]
  initialSummary: AdminCommissionSummary | null
}

// Radix Select forbids an empty-string item value, so "all" is the sentinel.
type TypeFilter = 'all' | 'accrual' | 'reversal'

export default function CommissionsAdminClient({
  initialLedger,
  initialSummary,
}: CommissionsAdminClientProps) {
  const queryClient = useQueryClient()
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [ratePercent, setRatePercent] = useState(
    fractionToPercent(initialSummary?.default_rate) || ''
  )

  const { data: summary } = useQuery({
    queryKey: ['admin-commissions-summary'],
    queryFn: async () => {
      const res = await api.get<AdminCommissionSummary>('/admin/commissions/summary')
      return res.data
    },
    initialData: initialSummary ?? undefined,
    staleTime: 30000,
  })

  const { data: ledger, isFetching } = useQuery({
    queryKey: ['admin-commissions', typeFilter],
    queryFn: async () => {
      const query = typeFilter === 'all' ? '' : `?type=${typeFilter}`
      const res = await api.get<PaginatedResponse<AdminCommission>>(`/admin/commissions${query}`)
      return res.data.data
    },
    initialData: typeFilter === 'all' ? initialLedger : undefined,
    staleTime: 30000,
  })

  const saveRateMutation = useMutation({
    mutationFn: (percent: string) =>
      // The settings endpoint takes a `settings` map of string values.
      api.patch('/admin/settings', {
        settings: { commission_rate: percentToFraction(percent) },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-commissions-summary'] })
      toast.success('Default commission rate updated')
    },
    onError: () => toast.error('Failed to update the default rate'),
  })

  const rateError = useMemo(() => {
    if (ratePercent === '') return undefined
    const n = Number(ratePercent)
    if (!Number.isFinite(n)) return 'Enter a number'
    if (n < 0 || n > 100) return 'Must be between 0 and 100'
    return undefined
  }, [ratePercent])

  const columns: ColumnDef<AdminCommission>[] = [
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-sm text-content-muted">
          {new Date(row.original.created_at).toLocaleDateString('en-GB')}
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
      accessorKey: 'order',
      header: 'Order',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-content-primary">
          {row.original.order?.order_number ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const isReversal = row.original.type === 'reversal'
        return (
          <Badge variant={isReversal ? 'warning' : 'success'}>
            {isReversal ? 'Reversal' : 'Accrual'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'rate',
      header: 'Rate',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-content-muted">
          {formatRate(row.original.rate)}
        </span>
      ),
    },
    {
      accessorKey: 'base_amount',
      header: 'Base',
      cell: ({ row }) => (
        <CurrencyDisplay
          amount={amountToNumber(row.original.base_amount)}
          className="text-sm text-content-muted"
        />
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Commission',
      cell: ({ row }) => {
        const amount = amountToNumber(row.original.amount)
        return (
          <CurrencyDisplay
            amount={amount}
            className={
              amount < 0
                ? 'text-sm font-semibold text-status-error'
                : 'text-sm font-semibold text-content-primary'
            }
          />
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Coins}
          label="Net commission"
          value={summary ? `${amountToNumber(summary.net).toLocaleString('hy-AM')} ֏` : '—'}
          trend="Accrued minus reversed"
          color="brand"
        />
        <StatCard
          icon={TrendingUp}
          label="Accrued"
          value={summary ? `${amountToNumber(summary.accrued).toLocaleString('hy-AM')} ֏` : '—'}
          trend="Charged on paid orders"
          color="success"
        />
        <StatCard
          icon={RotateCcw}
          label="Reversed"
          value={summary ? `${amountToNumber(summary.reversed).toLocaleString('hy-AM')} ֏` : '—'}
          trend="Refunded or cancelled"
          color="warning"
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-1 flex items-center gap-2">
          <Percent className="h-4 w-4 text-brand-500" />
          <p className="text-sm font-semibold text-content-primary">Default commission rate</p>
        </div>
        <p className="mb-4 text-xs text-content-muted">
          Charged on every paid order, on the order subtotal minus discount. Stores with their
          own rate override this — set that on the store&apos;s page.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <Input
              label="Rate"
              type="number"
              min={0}
              max={100}
              step={0.01}
              suffix="%"
              value={ratePercent}
              error={rateError}
              onChange={(e) => setRatePercent(e.target.value)}
            />
          </div>
          <Button
            loading={saveRateMutation.isPending}
            disabled={!!rateError || ratePercent === ''}
            onClick={() => saveRateMutation.mutate(ratePercent)}
          >
            Save rate
          </Button>
          {summary && (
            <p className="pb-2.5 text-xs text-content-muted">
              Currently <span className="font-semibold">{formatRate(summary.default_rate)}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-content-primary">Ledger</p>
          <div className="w-44">
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as TypeFilter)}
              options={[
                { value: 'all', label: 'All entries' },
                { value: 'accrual', label: 'Accruals only' },
                { value: 'reversal', label: 'Reversals only' },
              ]}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={ledger ?? []}
          loading={isFetching && !ledger}
          pageSize={20}
          emptyState={
            <EmptyState
              icon={Coins}
              title="No commission yet"
              description="Commission is recorded automatically the moment an order is paid."
            />
          }
        />
      </div>
    </div>
  )
}
