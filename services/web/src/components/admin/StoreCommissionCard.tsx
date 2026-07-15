'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import api from '@/lib/api'
import { formatRate, fractionToPercent, percentToFraction } from '@/lib/commission'
import type { AdminStore } from '@/types'

interface StoreCommissionCardProps {
  store: AdminStore
}

export default function StoreCommissionCard({ store }: StoreCommissionCardProps) {
  const router = useRouter()
  const [percent, setPercent] = useState(fractionToPercent(store.commission_rate))

  const inherits = store.commission_rate === null || store.commission_rate === undefined

  const mutation = useMutation({
    mutationFn: (value: string | null) =>
      api.patch(`/admin/stores/${store.slug}/commission-rate`, {
        commission_rate: value === null ? null : percentToFraction(value),
      }),
    onSuccess: (_res, value) => {
      toast.success(
        value === null ? 'Store now uses the platform default' : 'Commission rate updated'
      )
      router.refresh()
    },
    onError: () => toast.error('Failed to update the commission rate'),
  })

  const error = useMemo(() => {
    if (percent === '') return undefined
    const n = Number(percent)
    if (!Number.isFinite(n)) return 'Enter a number'
    if (n < 0 || n > 100) return 'Must be between 0 and 100'
    return undefined
  }, [percent])

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="mb-1 text-sm font-semibold text-content-primary">Commission</p>
      <p className="mb-4 text-xs text-content-muted">
        {inherits
          ? `Inheriting the platform default of ${formatRate(store.effective_commission_rate)}. Set a rate here to override it.`
          : `This store has its own rate of ${formatRate(store.commission_rate)}, so the platform default does not apply.`}
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-32">
          <Input
            label="Rate"
            type="number"
            min={0}
            max={100}
            step={0.01}
            suffix="%"
            value={percent}
            error={error}
            placeholder={fractionToPercent(store.effective_commission_rate)}
            onChange={(e) => setPercent(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          loading={mutation.isPending}
          disabled={!!error || percent === ''}
          onClick={() => mutation.mutate(percent)}
        >
          Save
        </Button>
        {!inherits && (
          <Button
            variant="outline"
            size="sm"
            disabled={mutation.isPending}
            onClick={() => {
              setPercent('')
              mutation.mutate(null)
            }}
          >
            Use default
          </Button>
        )}
      </div>
    </div>
  )
}
