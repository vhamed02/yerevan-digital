'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/ui/Modal'
import api from '@/lib/api'

type SuspendTargetType = 'store' | 'seller'

interface SuspendDialogProps {
  targetId: string | number | null
  targetName: string
  targetType: SuspendTargetType
  currentStatus?: string
  onClose: () => void
  invalidateKey?: string[]
}

export default function SuspendDialog({
  targetId,
  targetName,
  targetType,
  currentStatus,
  onClose,
  invalidateKey,
}: SuspendDialogProps) {
  const queryClient = useQueryClient()
  const isSuspended = currentStatus === 'suspended'
  const action = isSuspended ? 'activate' : 'suspend'

  const mutation = useMutation({
    mutationFn: (id: string | number) => {
      if (targetType === 'store') {
        const endpoint = isSuspended ? 'approve' : 'suspend'
        return api.patch(`/admin/stores/${id}/${endpoint}`)
      }
      const newStatus = isSuspended ? 'active' : 'suspended'
      return api.patch(`/admin/sellers/${id}/status`, { status: newStatus })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: invalidateKey ?? [`admin-${targetType}s`],
      })
      toast.success(`${targetType === 'store' ? 'Store' : 'Seller'} ${action}d successfully`)
      onClose()
    },
    onError: () => toast.error(`Failed to ${action} ${targetType}`),
  })

  return (
    <ConfirmModal
      open={targetId !== null}
      onOpenChange={(open) => !open && onClose()}
      title={`${isSuspended ? 'Activate' : 'Suspend'} ${targetType === 'store' ? 'Store' : 'Seller'}`}
      message={`Are you sure you want to ${action} "${targetName}"?`}
      confirmLabel={isSuspended ? 'Activate' : 'Suspend'}
      destructive={!isSuspended}
      loading={mutation.isPending}
      onConfirm={() => targetId !== null && mutation.mutate(targetId)}
    />
  )
}
