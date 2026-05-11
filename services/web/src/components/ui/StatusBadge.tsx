import { Badge } from './Badge'

type StatusValue =
  | 'active'
  | 'paid'
  | 'delivered'
  | 'pending'
  | 'processing'
  | 'suspended'
  | 'failed'
  | 'cancelled'
  | 'draft'
  | 'shipped'
  | string

const STATUS_MAP: Record<string, 'success' | 'warning' | 'error' | 'info' | 'secondary'> = {
  active: 'success',
  paid: 'success',
  delivered: 'success',
  pending: 'warning',
  processing: 'warning',
  suspended: 'error',
  failed: 'error',
  cancelled: 'error',
  draft: 'info',
  shipped: 'info',
}

interface StatusBadgeProps {
  status: StatusValue
  label?: string
  className?: string
}

function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const variant = STATUS_MAP[status.toLowerCase()] ?? 'secondary'
  return (
    <Badge variant={variant} className={className}>
      {label ?? status}
    </Badge>
  )
}

export { StatusBadge }
export type { StatusBadgeProps }
