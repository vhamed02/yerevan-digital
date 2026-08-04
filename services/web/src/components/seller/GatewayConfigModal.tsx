'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Copy, Eye, EyeOff } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import api from '@/lib/api'
import type { StoreGatewayConfig } from '@/types'

interface GatewayConfigModalProps {
  gateway: StoreGatewayConfig | null
  onClose: () => void
}

const URL_LABELS = {
  result_url: 'RESULT_URL',
  success_url: 'SUCCESS_URL',
  fail_url: 'FAIL_URL',
} as const

function CopyableUrl({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy — select the text manually')
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-content-muted">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-md bg-surface px-2 py-1.5 text-xs text-content-secondary">
          {url}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="shrink-0 rounded-md border border-border p-1.5 text-content-muted hover:text-content-primary"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}

export default function GatewayConfigModal({ gateway, onClose }: GatewayConfigModalProps) {
  const queryClient = useQueryClient()
  const [showSecret, setShowSecret] = useState(false)
  const [isSandbox, setIsSandbox] = useState(gateway?.is_sandbox ?? false)
  const [isEnabled, setIsEnabled] = useState(gateway?.is_enabled ?? false)
  const [credentials, setCredentials] = useState<Record<string, string>>({})

  const name = gateway?.display_name.hy || gateway?.display_name.en || gateway?.name || ''

  const mutation = useMutation({
    mutationFn: (data: {
      payment_gateway_id: number
      credentials: Record<string, string>
      is_sandbox: boolean
      is_enabled: boolean
    }) => api.post('/seller/payments/configure', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-gateways'] })
      toast.success('Gateway saved')
      onClose()
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(message ?? 'Failed to save gateway')
    },
  })

  if (!gateway) return null

  const fields = gateway.required_fields ?? []
  const incomplete = fields.some((f) => !credentials[f.key]?.trim())

  return (
    <Modal
      open={!!gateway}
      onOpenChange={(open) => !open && onClose()}
      title={`Configure ${name}`}
      size="sm"
    >
      <div className="flex flex-col gap-5">
        {gateway.instructions && (
          <div className="rounded-lg bg-surface-secondary p-3">
            <p className="mb-1 text-xs font-semibold text-content-muted">📋 How to get credentials:</p>
            <p className="text-sm text-content-secondary">
              {gateway.instructions.hy || gateway.instructions.en}
            </p>
          </div>
        )}

        {gateway.integration_urls && (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-secondary p-3">
            <p className="text-xs font-semibold text-content-muted">
              🔗 Give these three addresses to Idram
            </p>
            <p className="text-xs text-content-secondary">
              Idram registers them against your merchant account — they are not sent with each
              payment. Until Idram has them, payments will fail.
            </p>
            {(['result_url', 'success_url', 'fail_url'] as const).map((key) => (
              <CopyableUrl key={key} label={URL_LABELS[key]} url={gateway.integration_urls![key]} />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {gateway.is_configured && (
            <p className="text-xs text-content-muted">
              Credentials are stored encrypted and never sent back to this page. Re-enter them to
              save any change.
            </p>
          )}

          {fields.map((field) => {
            const isSecret =
              field.key.toLowerCase().includes('secret') || field.key.toLowerCase().includes('key')
            return (
              <div key={field.key} className="relative">
                <Input
                  label={field.label_hy || field.label_en}
                  type={isSecret && !showSecret ? 'password' : 'text'}
                  value={credentials[field.key] ?? ''}
                  autoComplete="off"
                  onChange={(e) =>
                    setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))
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
          {gateway.is_sandbox_available && (
            <label className="flex cursor-pointer items-center justify-between">
              <div>
                <p className="text-sm font-medium text-content-primary">⚙️ Sandbox Mode</p>
                <p className="text-xs text-content-muted">
                  Simulated checkout for testing. No real payments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSandbox((s) => !s)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isSandbox ? 'bg-brand-500' : 'bg-border'}`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isSandbox ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}
                />
              </button>
            </label>
          )}

          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <p className="text-sm font-medium text-content-primary">
                🟢 Enable {name} for my store
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEnabled((a) => !a)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isEnabled ? 'bg-status-success' : 'bg-border'}`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}
              />
            </button>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            loading={mutation.isPending}
            disabled={incomplete}
            onClick={() =>
              mutation.mutate({
                payment_gateway_id: gateway.id,
                credentials,
                is_sandbox: isSandbox,
                is_enabled: isEnabled,
              })
            }
          >
            Save Configuration
          </Button>
        </div>
      </div>
    </Modal>
  )
}
