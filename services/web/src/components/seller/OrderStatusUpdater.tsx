'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import api from '@/lib/api'

const NEXT_STATUS: Record<string, string[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

interface OrderStatusUpdaterProps {
  orderUuid: string
  currentStatus: string
  invalidateKey?: string[]
}

export default function OrderStatusUpdater({ orderUuid, currentStatus, invalidateKey }: OrderStatusUpdaterProps) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState(currentStatus)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const nextOptions = NEXT_STATUS[currentStatus] ?? []

  const mutation = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/seller/orders/${orderUuid}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey ?? ['seller-orders', orderUuid] })
      toast.success('Order status updated')
      setConfirmOpen(false)
    },
    onError: () => toast.error('Failed to update status'),
  })

  if (nextOptions.length === 0) return null

  return (
    <>
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">Update Status</p>
        <div className="flex flex-col gap-3">
          <select
            className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value={currentStatus}>{currentStatus} (current)</option>
            {nextOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Button
            size="sm"
            className="w-full"
            onClick={() => setConfirmOpen(true)}
            disabled={selected === currentStatus}
          >
            Update Status
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Update Order Status"
        message={`Change status from "${currentStatus}" to "${selected}"?`}
        confirmLabel="Update"
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate(selected)}
      />
    </>
  )
}
