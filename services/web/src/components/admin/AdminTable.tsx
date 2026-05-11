'use client'

import { DataTable } from '@/components/ui/DataTable'
import type { ColumnDef } from '@tanstack/react-table'

interface AdminTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  loading?: boolean
  toolbar?: React.ReactNode
  emptyState?: React.ReactNode
  pageSize?: number
}

export default function AdminTable<TData>({
  columns,
  data,
  loading,
  toolbar,
  emptyState,
  pageSize = 10,
}: AdminTableProps<TData>) {
  return (
    <div className="flex flex-col gap-4">
      {toolbar && <div className="flex flex-wrap items-center gap-3">{toolbar}</div>}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyState={emptyState}
        pageSize={pageSize}
      />
    </div>
  )
}
