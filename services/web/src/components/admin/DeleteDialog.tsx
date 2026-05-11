'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/ui/Modal'
import api from '@/lib/api'

type DeleteTargetType = 'store' | 'seller' | 'category' | 'template'

interface DeleteDialogProps {
  targetId: number | null
  targetName: string
  targetType: DeleteTargetType
  onClose: () => void
  onDeleted?: () => void
  invalidateKey?: string[]
}

const endpointMap: Record<DeleteTargetType, string> = {
  store: 'stores',
  seller: 'sellers',
  category: 'categories',
  template: 'templates',
}

export default function DeleteDialog({
  targetId,
  targetName,
  targetType,
  onClose,
  onDeleted,
  invalidateKey,
}: DeleteDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/${endpointMap[targetType]}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: invalidateKey ?? [`admin-${targetType}s`],
      })
      toast.success(`${targetType.charAt(0).toUpperCase() + targetType.slice(1)} deleted`)
      onClose()
      onDeleted?.()
    },
    onError: () => toast.error(`Failed to delete ${targetType}`),
  })

  return (
    <ConfirmModal
      open={targetId !== null}
      onOpenChange={(open) => !open && onClose()}
      title={`Delete ${targetType.charAt(0).toUpperCase() + targetType.slice(1)}`}
      message={`Are you sure you want to delete "${targetName}"? This action cannot be undone.`}
      confirmLabel="Delete"
      destructive
      loading={mutation.isPending}
      onConfirm={() => targetId !== null && mutation.mutate(targetId)}
    />
  )
}
