'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import api from '@/lib/api'
import type { StoreGatewayConfig } from '@/types'

interface GatewayConfigModalProps {
  gateway: StoreGatewayConfig | null
  onClose: () => void
}

export default function GatewayConfigModal({ gateway, onClose }: GatewayConfigModalProps) {
  const queryClient = useQueryClient()
  const [showSecret, setShowSecret] = useState(false)
  const [isSandbox, setIsSandbox] = useState(gateway?.is_sandbox ?? false)
  const [isActive, setIsActive] = useState(gateway?.is_active ?? false)
  const [configValues, setConfigValues] = useState<Record<string, string>>(gateway?.config ?? {})

  const name = gateway?.name.hy || gateway?.name.en || ''

  const mutation = useMutation({
    mutationFn: (data: {
      config: Record<string, string>
      is_sandbox: boolean
      is_active: boolean
    }) => api.patch(`/seller/payment-gateways/${gateway!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-gateways'] })
      toast.success('Gateway saved')
      onClose()
    },
    onError: () => toast.error('Failed to save gateway'),
  })

  if (!gateway) return null

  const fields = gateway.required_fields ?? []

  return (
    <Modal open={!!gateway} onOpenChange={(open) => !open && onClose()} title={`Configure ${name}`} size="sm">
      <div className="flex flex-col gap-5">
        {gateway.instructions && (
          <div className="rounded-lg bg-surface-secondary p-3">
            <p className="text-xs font-semibold text-content-muted mb-1">📋 How to get credentials:</p>
            <p className="text-sm text-content-secondary">
              {gateway.instructions.hy || gateway.instructions.en}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {fields.map((field, i) => {
            const isSecret = field.key.toLowerCase().includes('secret') || field.key.toLowerCase().includes('key')
            return (
              <div key={field.key} className="relative">
                <Input
                  label={field.label_hy || field.label_en}
                  type={isSecret && !showSecret ? 'password' : 'text'}
                  value={configValues[field.key] ?? ''}
                  onChange={(e) =>
                    setConfigValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  suffix={
                    isSecret ? (
                      <button
                        type="button"
                        onClick={() => setShowSecret((s) => !s)}
                        className="pointer-events-auto"
                        aria-label={showSecret ? 'Hide' : 'Show'}
                      >
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    ) : undefined
                  }
                />
              </div>
            )
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <p className="text-sm font-medium text-content-primary">⚙️ Sandbox Mode</p>
              <p className="text-xs text-content-muted">Use sandbox for testing. No real payments.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsSandbox((s) => !s)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isSandbox ? 'bg-brand-500' : 'bg-border'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isSandbox ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
            </button>
          </label>

          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <p className="text-sm font-medium text-content-primary">🟢 Enable {name} for my store</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive((a) => !a)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isActive ? 'bg-status-success' : 'bg-border'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
            </button>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            loading={mutation.isPending}
            onClick={() =>
              mutation.mutate({ config: configValues, is_sandbox: isSandbox, is_active: isActive })
            }
          >
            Save Configuration
          </Button>
        </div>
      </div>
    </Modal>
  )
}
