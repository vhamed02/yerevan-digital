'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Truck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import api from '@/lib/api'
import type { ApiError, SellerShippingZone } from '@/types'
import type { AxiosError } from 'axios'

interface ShippingSellerClientProps {
  initialZones: SellerShippingZone[]
}

interface ZoneForm {
  name_hy: string
  name_en: string
  cities: string
  rate: string
  free_over: string
  is_default: boolean
  is_active: boolean
}

const emptyForm: ZoneForm = {
  name_hy: '',
  name_en: '',
  cities: '',
  rate: '',
  free_over: '',
  is_default: false,
  is_active: true,
}

function toForm(zone: SellerShippingZone): ZoneForm {
  return {
    name_hy: zone.name.hy ?? '',
    name_en: zone.name.en ?? '',
    cities: (zone.cities ?? []).join(', '),
    rate: String(Number(zone.rate)),
    free_over: zone.free_over ? String(Number(zone.free_over)) : '',
    is_default: zone.is_default,
    is_active: zone.is_active,
  }
}

function toPayload(form: ZoneForm) {
  return {
    name: { hy: form.name_hy, en: form.name_en },
    cities: form.cities
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean),
    rate: Number(form.rate || 0),
    free_over: form.free_over === '' ? null : Number(form.free_over),
    is_default: form.is_default,
    is_active: form.is_active,
  }
}

export default function ShippingSellerClient({ initialZones }: ShippingSellerClientProps) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<SellerShippingZone | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ZoneForm>(emptyForm)

  const { data: zones } = useQuery({
    queryKey: ['seller-shipping-zones'],
    queryFn: async () => {
      const res = await api.get<SellerShippingZone[]>('/seller/shipping-zones')
      return res.data
    },
    initialData: initialZones,
    staleTime: 30000,
  })

  const saveMutation = useMutation({
    mutationFn: (data: ZoneForm) =>
      editing
        ? api.patch(`/seller/shipping-zones/${editing.uuid}`, toPayload(data))
        : api.post('/seller/shipping-zones', toPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-shipping-zones'] })
      toast.success(editing ? 'Zone updated' : 'Zone created')
      setOpen(false)
    },
    onError: (error: AxiosError<ApiError>) => {
      const errors = error.response?.data?.errors
      const first = errors ? Object.values(errors)[0]?.[0] : undefined
      toast.error(first ?? 'Failed to save the zone')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (zone: SellerShippingZone) => api.delete(`/seller/shipping-zones/${zone.uuid}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-shipping-zones'] })
      toast.success('Zone deleted')
    },
    onError: () => toast.error('Failed to delete the zone'),
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(zone: SellerShippingZone) {
    setEditing(zone)
    setForm(toForm(zone))
    setOpen(true)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold text-content-primary">Shipping</h1>
          <p className="text-sm text-content-muted">
            Charge by destination. With no zones set up, every order ships free.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New zone
        </Button>
      </div>

      {zones.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            icon={Truck}
            title="No shipping zones"
            description="Until you add a zone, orders ship free. Add one for Yerevan and a fallback for the regions."
            action={{ label: 'New zone', onClick: openCreate }}
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border text-left text-content-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Zone</th>
                <th className="px-4 py-3 font-medium">Cities</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Free over</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.uuid} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-content-primary">
                    <div className="flex items-center gap-2">
                      {zone.name.hy || zone.name.en}
                      {zone.is_default && <Badge variant="info">Fallback</Badge>}
                    </div>
                  </td>
                  <td className="max-w-[260px] px-4 py-3 text-content-muted">
                    {zone.cities.length > 0 ? zone.cities.join(', ') : 'Any other city'}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-content-primary">
                    {Number(zone.rate).toLocaleString('hy-AM')} ֏
                  </td>
                  <td className="px-4 py-3 tabular-nums text-content-muted">
                    {zone.free_over ? `${Number(zone.free_over).toLocaleString('hy-AM')} ֏` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={zone.is_active ? 'success' : 'secondary'}>
                      {zone.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(zone)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this shipping zone?')) deleteMutation.mutate(zone)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-status-error" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'Edit zone' : 'New shipping zone'}
        size="md"
      >
        <div className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name (Armenian)"
              placeholder="Երևան"
              value={form.name_hy}
              onChange={(e) => setForm((f) => ({ ...f, name_hy: e.target.value }))}
            />
            <Input
              label="Name (English)"
              placeholder="Yerevan"
              value={form.name_en}
              onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
            />
          </div>

          <Input
            label="Cities"
            placeholder="Yerevan, Abovyan"
            value={form.cities}
            onChange={(e) => setForm((f) => ({ ...f, cities: e.target.value }))}
            helperText="Comma separated, matched case-insensitively against the checkout city. Leave empty for a fallback zone."
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Rate (֏)"
              type="number"
              min={0}
              value={form.rate}
              onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
            />
            <Input
              label="Free over (֏)"
              type="number"
              min={0}
              value={form.free_over}
              onChange={(e) => setForm((f) => ({ ...f, free_over: e.target.value }))}
              helperText="Optional"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded"
              checked={form.is_default}
              onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
            />
            <div>
              <p className="text-sm text-content-primary">Use as fallback</p>
              <p className="text-xs text-content-muted">
                Applies to any city no other zone lists. Only one zone can be the fallback.
              </p>
            </div>
          </label>

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
              disabled={form.name_en === '' || form.name_hy === '' || form.rate === ''}
              onClick={() => saveMutation.mutate(form)}
            >
              {editing ? 'Save changes' : 'Create zone'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
