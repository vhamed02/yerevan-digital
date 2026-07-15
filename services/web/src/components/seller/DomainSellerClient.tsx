'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import { Globe, Check, Copy, AlertCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import api from '@/lib/api'
import type { ApiError, SellerDomain } from '@/types'

interface DomainSellerClientProps {
  initialDomain: SellerDomain | null
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-content-muted">{label}</span>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded border border-border bg-surface-secondary px-3 py-2 font-mono text-xs text-content-primary">
          {value}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

export default function DomainSellerClient({ initialDomain }: DomainSellerClientProps) {
  const queryClient = useQueryClient()
  const [input, setInput] = useState(initialDomain?.custom_domain ?? '')

  const { data: domain } = useQuery({
    queryKey: ['seller-domain'],
    queryFn: async () => {
      const res = await api.get<SellerDomain>('/seller/domain')
      return res.data
    },
    initialData: initialDomain ?? undefined,
    staleTime: 15000,
  })

  function apiMessage(error: unknown, fallback: string) {
    return (error as AxiosError<ApiError>).response?.data?.message ?? fallback
  }

  const saveMutation = useMutation({
    mutationFn: (host: string) => api.patch('/seller/domain', { custom_domain: host }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-domain'] })
      toast.success('Domain saved — now add the DNS records')
    },
    onError: (error) => toast.error(apiMessage(error, 'Failed to save the domain')),
  })

  const verifyMutation = useMutation({
    mutationFn: () => api.post('/seller/domain/verify'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-domain'] })
      toast.success('Domain verified — your store is live on it')
    },
    onError: (error) => toast.error(apiMessage(error, 'Could not verify the domain yet')),
  })

  const removeMutation = useMutation({
    mutationFn: () => api.delete('/seller/domain'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-domain'] })
      setInput('')
      toast.success('Domain removed')
    },
    onError: (error) => toast.error(apiMessage(error, 'Failed to remove the domain')),
  })

  const current = domain?.custom_domain ?? null
  const verified = domain?.verified ?? false
  const dns = domain?.dns ?? null

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-heading text-xl font-bold text-content-primary">Custom domain</h1>
        <p className="text-sm text-content-muted">
          Serve your storefront on your own domain instead of a yerevan.digital address.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              label="Domain"
              placeholder="shop.example.am"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              helperText="Without https:// — just the hostname."
            />
          </div>
          <Button
            loading={saveMutation.isPending}
            disabled={input.trim() === '' || input.trim() === current}
            onClick={() => saveMutation.mutate(input.trim())}
          >
            Save
          </Button>
        </div>

        {current && (
          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex min-w-0 items-center gap-2">
              <Globe className="h-4 w-4 shrink-0 text-content-muted" />
              <span className="truncate font-mono text-sm text-content-primary">{current}</span>
              <Badge variant={verified ? 'success' : 'warning'}>
                {verified ? 'Verified' : 'Pending verification'}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={removeMutation.isPending}
              onClick={() => {
                if (confirm(`Remove ${current}? Your store stays reachable on yerevan.digital.`)) {
                  removeMutation.mutate()
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-status-error" />
            </Button>
          </div>
        )}
      </div>

      {current && dns && (
        <div className="mt-4 flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <div>
            <p className="text-sm font-semibold text-content-primary">1. Prove you own it</p>
            <p className="mb-3 text-xs text-content-muted">
              Add this TXT record at your DNS provider, then press Verify. DNS can take a few
              minutes to propagate.
            </p>
            <div className="flex flex-col gap-3">
              <CopyRow label="TXT record name" value={dns.txt_name} />
              <CopyRow label="TXT record value" value={dns.txt_value} />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold text-content-primary">2. Point it at us</p>
            <p className="mb-3 text-xs text-content-muted">
              Add an A record for <span className="font-mono">{current}</span> pointing here.
            </p>
            <CopyRow label="A record" value={dns.a_record} />
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-800">
              <span className="font-semibold">HTTPS is required.</span> Put the domain behind
              Cloudflare (free plan, proxy enabled) pointing at the A record above — Cloudflare
              issues the certificate. Without it your domain will only answer on http://.
            </p>
          </div>

          {!verified && (
            <div className="flex justify-end border-t border-border pt-4">
              <Button loading={verifyMutation.isPending} onClick={() => verifyMutation.mutate()}>
                Verify domain
              </Button>
            </div>
          )}

          {verified && (
            <div className="flex items-center gap-2 border-t border-border pt-4 text-sm text-status-success">
              <Check className="h-4 w-4" />
              <span>
                Live on{' '}
                <a
                  href={`https://${current}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  {current}
                </a>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
