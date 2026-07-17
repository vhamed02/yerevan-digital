'use client'

import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import useAuthStore from '@/stores/auth.store'
import api from '@/lib/api'
import { redirectToGateway } from '@/lib/payment'
import type { SellerInvoice } from '@/types'

interface InvoiceDetailClientProps {
  invoice: SellerInvoice
}

interface PayResponse {
  redirect_url: string
  form_params?: Record<string, string> | null
  invoice: string
}

function statusOf(status: SellerInvoice['status']): { label: string; variant: 'success' | 'warning' | 'secondary' } {
  if (status === 'paid') return { label: 'Paid', variant: 'success' }
  if (status === 'void') return { label: 'Void', variant: 'secondary' }
  return { label: 'Pending', variant: 'warning' }
}

export default function InvoiceDetailClient({ invoice }: InvoiceDetailClientProps) {
  const router = useRouter()
  const { sellerStore } = useAuthStore()
  const storeName = sellerStore?.name.en || sellerStore?.name.hy || ''
  const status = statusOf(invoice.status)

  const payMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<PayResponse>(`/seller/invoices/${invoice.uuid}/pay`)
      return res.data
    },
    onSuccess: (data) => redirectToGateway(data.redirect_url, data.form_params),
    onError: () => toast.error('Failed to start the payment'),
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 print:max-w-none print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={() => router.push('/seller/invoices')}>
          <ArrowLeft className="h-4 w-4" />
          Back to invoices
        </Button>
        <div className="flex gap-2">
          {invoice.is_payable && (
            <Button loading={payMutation.isPending} onClick={() => payMutation.mutate()}>
              Pay
            </Button>
          )}
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-8 print:rounded-none print:border-0 print:p-0">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="font-heading text-lg font-bold text-content-primary">Yerevan Digital</p>
            <p className="text-sm text-content-muted">Platform commission invoice</p>
          </div>
          <div className="text-right">
            <p className="font-heading text-xl font-bold text-content-primary">{invoice.number}</p>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-6 border-y border-border py-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">Billed to</p>
            <p className="mt-1 font-medium text-content-primary">{storeName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">Billing period</p>
            <p className="mt-1 font-medium text-content-primary">
              {invoice.period_start} &ndash; {invoice.period_end}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">Issued</p>
            <p className="mt-1 font-medium text-content-primary">
              {new Date(invoice.created_at).toLocaleDateString('en-GB')}
            </p>
          </div>
          {invoice.paid_at && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">Paid</p>
              <p className="mt-1 font-medium text-content-primary">
                {new Date(invoice.paid_at).toLocaleDateString('en-GB')}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-content-muted">Platform commission owed</p>
          <CurrencyDisplay amount={Number(invoice.amount)} className="text-2xl font-bold text-content-primary" />
        </div>
      </div>
    </div>
  )
}
