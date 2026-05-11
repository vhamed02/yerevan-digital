'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/ui/Modal'
import api from '@/lib/api'

interface ApproveStoreDialogProps {
  storeId: number | null
  storeName: string
  onClose: () => void
  invalidateKey?: string[]
}

export default function ApproveStoreDialog({
  storeId,
  storeName,
  onClose,
  invalidateKey = ['admin-stores'],
}: ApproveStoreDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/stores/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey })
      toast.success('Store approved successfully')
      onClose()
    },
    onError: () => toast.error('Failed to approve store'),
  })

  return (
    <ConfirmModal
      open={storeId !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Approve Store"
      message={`Approve "${storeName}"? The seller will be notified and their store will become active.`}
      confirmLabel="Approve"
      loading={mutation.isPending}
      onConfirm={() => storeId !== null && mutation.mutate(storeId)}
    />
  )
}
