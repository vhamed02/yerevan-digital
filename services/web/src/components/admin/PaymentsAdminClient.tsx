'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import SlidePanel from './SlidePanel'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { AdminPaymentGateway } from '@/types'

interface PaymentsAdminClientProps {
  initialGateways: AdminPaymentGateway[]
}

interface GatewayFormData {
  name_hy: string
  name_en: string
  instructions_hy: string
  instructions_en: string
  required_fields: string
}

function gatewayToForm(gw: AdminPaymentGateway): GatewayFormData {
  return {
    name_hy: gw.name.hy,
    name_en: gw.name.en,
    instructions_hy: gw.instructions?.hy ?? '',
    instructions_en: gw.instructions?.en ?? '',
    required_fields: gw.required_fields ?? '',
  }
}

export default function PaymentsAdminClient({ initialGateways }: PaymentsAdminClientProps) {
  const queryClient = useQueryClient()
  const [editTarget, setEditTarget] = useState<AdminPaymentGateway | null>(null)
  const [form, setForm] = useState<GatewayFormData>({
    name_hy: '',
    name_en: '',
    instructions_hy: '',
    instructions_en: '',
    required_fields: '',
  })

  const { data: gateways } = useQuery({
    queryKey: ['admin-payment-gateways'],
    queryFn: async () => {
      const res = await api.get<{ data: AdminPaymentGateway[] }>('/admin/payment-gateways')
      return res.data.data
    },
    initialData: initialGateways,
    staleTime: 60000,
  })

  const toggleMutation = useMutation({
    mutationFn: (gw: AdminPaymentGateway) =>
      api.patch(`/admin/payment-gateways/${gw.id}`, {
        is_platform_active: !gw.is_platform_active,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-gateways'] })
      toast.success('Gateway updated')
    },
    onError: () => toast.error('Failed to update gateway'),
  })

  const saveMutation = useMutation({
    mutationFn: (payload: GatewayFormData) =>
      api.patch(`/admin/payment-gateways/${editTarget!.id}`, {
        name: { hy: payload.name_hy, en: payload.name_en },
        instructions: { hy: payload.instructions_hy, en: payload.instructions_en },
        required_fields: payload.required_fields,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-gateways'] })
      toast.success('Gateway saved')
      setEditTarget(null)
    },
    onError: () => toast.error('Failed to save gateway'),
  })

  function openEdit(gw: AdminPaymentGateway) {
    setEditTarget(gw)
    setForm(gatewayToForm(gw))
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <h1 className="font-heading text-2xl font-bold text-content-primary">Payment Gateways</h1>

        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary">
              <tr>
                {['Gateway', 'Active Stores', 'Platform Status', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-content-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {gateways.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-content-muted">
                    No payment gateways configured
                  </td>
                </tr>
              ) : (
                gateways.map((gw) => (
                  <tr key={gw.id} className="hover:bg-surface-secondary transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-content-primary">
                          {gw.name.hy || gw.name.en}
                        </p>
                        <p className="text-xs text-content-muted">{gw.key}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-content-secondary">{gw.active_store_count}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleMutation.mutate(gw)}
                        className={cn(
                          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                          gw.is_platform_active ? 'bg-brand-500' : 'bg-border'
                        )}
                        aria-label="Toggle gateway"
                      >
                        <span
                          className={cn(
                            'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                            gw.is_platform_active ? 'translate-x-[18px]' : 'translate-x-[3px]'
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <Button variant="outline" size="sm" onClick={() => openEdit(gw)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SlidePanel
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        title="Edit Payment Gateway"
        description={editTarget?.key}
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate(form)
          }}
        >
          <Input
            label="Display Name (Armenian)"
            value={form.name_hy}
            onChange={(e) => setForm((f) => ({ ...f, name_hy: e.target.value }))}
            required
          />
          <Input
            label="Display Name (English)"
            value={form.name_en}
            onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
            required
          />
          <Textarea
            label="Instructions (Armenian)"
            value={form.instructions_hy}
            onChange={(e) => setForm((f) => ({ ...f, instructions_hy: e.target.value }))}
            rows={3}
          />
          <Textarea
            label="Instructions (English)"
            value={form.instructions_en}
            onChange={(e) => setForm((f) => ({ ...f, instructions_en: e.target.value }))}
            rows={3}
          />
          <Textarea
            label="Required Fields (JSON)"
            value={form.required_fields}
            onChange={(e) => setForm((f) => ({ ...f, required_fields: e.target.value }))}
            rows={4}
            placeholder='[{"key": "account_number", "label_hy": "...", "label_en": "..."}]'
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </SlidePanel>
    </>
  )
}
