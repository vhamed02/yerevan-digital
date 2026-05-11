import { Check } from 'lucide-react'

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
]

const ORDER_RANK: Record<string, number> = {
  pending: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
  cancelled: -1,
}

interface OrderTimelineProps {
  status: string
  timestamps?: Partial<Record<string, string>>
}

export default function OrderTimeline({ status, timestamps }: OrderTimelineProps) {
  const rank = ORDER_RANK[status] ?? 0
  const isCancelled = status === 'cancelled'

  return (
    <div className="flex items-center gap-0">
      {TIMELINE_STEPS.map((step, i) => {
        const done = ORDER_RANK[step.key] <= rank && !isCancelled
        const current = step.key === status
        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                  done
                    ? 'border-status-success bg-status-success'
                    : 'border-border bg-surface'
                } ${current ? 'ring-2 ring-brand-500/30' : ''}`}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5 text-white" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-border" />
                )}
              </div>
              <p className={`mt-1 text-xs ${done ? 'font-medium text-content-primary' : 'text-content-muted'}`}>
                {step.label}
              </p>
              {timestamps?.[step.key] && (
                <p className="text-[10px] text-content-muted">
                  {new Date(timestamps[step.key]!).toLocaleDateString()}
                </p>
              )}
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 -mt-5 ${
                  ORDER_RANK[TIMELINE_STEPS[i + 1].key] <= rank && !isCancelled
                    ? 'bg-status-success'
                    : 'bg-border'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
