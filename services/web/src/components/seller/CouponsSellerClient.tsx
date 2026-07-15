'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import api from '@/lib/api'
import type { ApiError, PaginatedResponse, SellerCoupon } from '@/types'
import type { AxiosError } from 'axios'

interface CouponsSellerClientProps {
  initialCoupons: SellerCoupon[]
}

interface CouponForm {
  code: string
  type: 'fixed' | 'percent'
  value: string
  min_order_amount: string
  max_discount_amount: string
  usage_limit: string
  starts_at: string
  ends_at: string
  is_active: boolean
}

const emptyForm: CouponForm = {
  code: '',
  type: 'fixed',
  value: '',
  min_order_amount: '0',
  max_discount_amount: '',
  usage_limit: '',
  starts_at: '',
  ends_at: '',
  is_active: true,
}

function toForm(coupon: SellerCoupon): CouponForm {
  return {
    code: coupon.code,
    type: coupon.type,
    value: String(Number(coupon.value)),
    min_order_amount: String(Number(coupon.min_order_amount)),
    max_discount_amount: coupon.max_discount_amount ? String(Number(coupon.max_discount_amount)) : '',
    usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
    starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 10) : '',
    ends_at: coupon.ends_at ? coupon.ends_at.slice(0, 10) : '',
    is_active: coupon.is_active,
  }
}

/** Empty optional fields must go up as null, not "" — the API types them as nullable. */
function toPayload(form: CouponForm) {
  return {
    code: form.code,
    type: form.type,
    value: Number(form.value),
    min_order_amount: Number(form.min_order_amount || 0),
    max_discount_amount: form.max_discount_amount === '' ? null : Number(form.max_discount_amount),
    usage_limit: form.usage_limit === '' ? null : Number(form.usage_limit),
    starts_at: form.starts_at === '' ? null : form.starts_at,
    ends_at: form.ends_at === '' ? null : form.ends_at,
    is_active: form.is_active,
  }
}

function statusOf(coupon: SellerCoupon): { label: string; variant: 'success' | 'warning' | 'secondary' } {
  if (!coupon.is_active) return { label: 'Inactive', variant: 'secondary' }
  if (coupon.is_expired) return { label: 'Expired', variant: 'warning' }
  if (coupon.is_exhausted) return { label: 'Used up', variant: 'warning' }
  return { label: 'Active', variant: 'success' }
}

export default function CouponsSellerClient({ initialCoupons }: CouponsSellerClientProps) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<SellerCoupon | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CouponForm>(emptyForm)

  const { data: coupons } = useQuery({
    queryKey: ['seller-coupons'],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<SellerCoupon>>('/seller/coupons')
      return res.data.data
    },
    initialData: initialCoupons,
    staleTime: 30000,
  })

  const saveMutation = useMutation({
    mutationFn: (data: CouponForm) =>
      editing
        ? api.patch(`/seller/coupons/${editing.uuid}`, toPayload(data))
        : api.post('/seller/coupons', toPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-coupons'] })
      toast.success(editing ? 'Coupon updated' : 'Coupon created')
      setOpen(false)
    },
    onError: (error: AxiosError<ApiError>) => {
      const errors = error.response?.data?.errors
      const first = errors ? Object.values(errors)[0]?.[0] : undefined
      toast.error(first ?? 'Failed to save the coupon')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (coupon: SellerCoupon) => api.delete(`/seller/coupons/${coupon.uuid}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-coupons'] })
      toast.success('Coupon deleted')
    },
    onError: () => toast.error('Failed to delete the coupon'),
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(coupon: SellerCoupon) {
    setEditing(coupon)
    setForm(toForm(coupon))
    setOpen(true)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold text-content-primary">Coupons</h1>
          <p className="text-sm text-content-muted">
            Discount codes shoppers can apply at checkout. Discounts come off the product
            subtotal, never off shipping.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New coupon
        </Button>
      </div>

      {coupons.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            icon={Ticket}
            title="No coupons yet"
            description="Create a code and shoppers can redeem it at checkout."
            action={{ label: 'New coupon', onClick: openCreate }}
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border text-left text-content-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Min. order</th>
                <th className="px-4 py-3 font-medium">Used</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const status = statusOf(coupon)
                return (
                  <tr key={coupon.uuid} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono font-semibold text-content-primary">
                      {coupon.code}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-content-primary">
                      {coupon.type === 'percent'
                        ? `${Number(coupon.value)}%`
                        : `${Number(coupon.value).toLocaleString('hy-AM')} ֏`}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-content-muted">
                      {Number(coupon.min_order_amount) > 0
                        ? `${Number(coupon.min_order_amount).toLocaleString('hy-AM')} ֏`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-content-muted">
                      {coupon.used_count}
                      {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(coupon)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete coupon ${coupon.code}?`)) {
                              deleteMutation.mutate(coupon)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-status-error" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editing ? `Edit ${editing.code}` : 'New coupon'}
        size="md"
      >
        <div className="flex flex-col gap-4 p-5">
          <Input
            label="Code"
            placeholder="SUMMER25"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            helperText="Letters, numbers, hyphens and underscores. Shoppers type this at checkout."
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              value={form.type}
              onValueChange={(value) => setForm((f) => ({ ...f, type: value as 'fixed' | 'percent' }))}
              options={[
                { value: 'fixed', label: 'Fixed amount (֏)' },
                { value: 'percent', label: 'Percentage (%)' },
              ]}
            />
            <Input
              label={form.type === 'percent' ? 'Percent off' : 'Amount off (֏)'}
              type="number"
              min={0}
              max={form.type === 'percent' ? 100 : undefined}
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Minimum order (֏)"
              type="number"
              min={0}
              value={form.min_order_amount}
              onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))}
            />
            {form.type === 'percent' && (
              <Input
                label="Max discount (֏)"
                type="number"
                min={0}
                value={form.max_discount_amount}
                onChange={(e) => setForm((f) => ({ ...f, max_discount_amount: e.target.value }))}
                helperText="Optional cap"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Starts"
              type="date"
              value={form.starts_at}
              onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
            />
            <Input
              label="Ends"
              type="date"
              value={form.ends_at}
              onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
            />
          </div>

          <Input
            label="Usage limit"
            type="number"
            min={1}
            value={form.usage_limit}
            onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
            helperText="Leave empty for unlimited redemptions."
          />

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            <span className="text-sm text-content-primary">Active</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saveMutation.isPending}
              disabled={form.code === '' || form.value === ''}
              onClick={() => saveMutation.mutate(form)}
            >
              {editing ? 'Save changes' : 'Create coupon'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
