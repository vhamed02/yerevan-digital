'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import api from '@/lib/api'
import type { AdminStore } from '@/types'

interface PendingApprovalBannerProps {
  stores: AdminStore[]
}

export default function PendingApprovalBanner({ stores }: PendingApprovalBannerProps) {
  const queryClient = useQueryClient()
  const [rejectTarget, setRejectTarget] = useState<AdminStore | null>(null)
  const [approvingSlug, setApprovingSlug] = useState<string | null>(null)

  const approve = useMutation({
    mutationFn: (slug: string) => api.patch(`/admin/stores/${slug}/approve`),
    onMutate: (slug) => setApprovingSlug(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      toast.success('Store approved')
    },
    onError: () => toast.error('Failed to approve store'),
    onSettled: () => setApprovingSlug(null),
  })

  const reject = useMutation({
    mutationFn: (slug: string) => api.patch(`/admin/stores/${slug}/suspend`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      toast.success('Store rejected')
      setRejectTarget(null)
    },
    onError: () => toast.error('Failed to reject store'),
  })

  if (stores.length === 0) return null

  return (
    <>
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <p className="text-sm font-semibold text-amber-800">
            {stores.length} store{stores.length > 1 ? 's' : ''} pending approval
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {stores.map((store) => (
            <li
              key={store.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex flex-col">
                <p className="text-sm font-medium text-content-primary">
                  {store.name.hy || store.name.en}
                </p>
                <p className="text-xs text-content-muted">
                  {store.seller?.name} · registered {store.registered_days_ago ?? 0} day
                  {(store.registered_days_ago ?? 0) !== 1 ? 's' : ''} ago
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="success"
                  loading={approvingSlug === store.slug}
                  onClick={() => approve.mutate(store.slug)}
                >
                  <Check className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRejectTarget(store)}
                >
                  <X className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <ConfirmModal
        open={rejectTarget !== null}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        title="Reject Store"
        message={`Are you sure you want to reject "${rejectTarget?.name.hy || rejectTarget?.name.en}"? This will suspend the store and notify the seller.`}
        confirmLabel="Reject"
        destructive
        loading={reject.isPending}
        onConfirm={() => rejectTarget && reject.mutate(rejectTarget.slug)}
      />
    </>
  )
}
