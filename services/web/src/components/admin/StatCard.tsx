import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const colorMap = {
  brand: 'bg-brand-500/10 text-brand-500',
  success: 'bg-status-success/10 text-status-success',
  info: 'bg-blue-500/10 text-blue-500',
  warning: 'bg-amber-500/10 text-amber-500',
  error: 'bg-status-error/10 text-status-error',
}

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: string
  color?: keyof typeof colorMap
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color = 'brand',
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-content-muted">{label}</p>
          <p className="font-heading text-2xl font-bold text-content-primary">{value}</p>
          {trend && <p className="text-xs text-content-muted">{trend}</p>}
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
