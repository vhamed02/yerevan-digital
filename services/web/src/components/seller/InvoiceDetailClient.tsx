'use client'

import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import api from '@/lib/api'
import { redirectToGateway } from '@/lib/payment'
import type { SellerInvoice, SellerStore } from '@/types'

interface InvoiceDetailClientProps {
  invoice: SellerInvoice
  store: SellerStore | null
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

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })
}

export default function InvoiceDetailClient({ invoice, store }: InvoiceDetailClientProps) {
  const router = useRouter()
  const storeName = store?.name.en || store?.name.hy || ''
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
    <div className="mx-auto max-w-[55%] px-4 py-6 sm:px-6 lg:px-8 print:m-0 print:max-w-none print:p-0">
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

      {/* On screen this matches the rest of the seller dashboard (rounded card,
          theme colors, Badge). On print it becomes a plain black-on-white paper
          document, narrower (55% width) and ~30% smaller throughout (explicit
          per-element sizes below — `zoom` does not affect Chromium's print/PDF
          pipeline, so it can't be used for this) — no outer border, only the
          line-item table stays bordered. */}
      <div className="rounded-xl border border-border bg-surface p-6 text-content-primary sm:p-8 print:rounded-sm print:border-0 print:bg-white print:p-0 print:text-black">
        <div className="flex items-start justify-between gap-6 border-b border-border pb-6 print:gap-4 print:border-black print:pb-4">
          <div>
            <p className="font-heading text-xl font-bold text-content-primary print:text-[14px] print:text-black">
              Yerevan Digital
            </p>
            <p className="mt-1 text-xs text-content-muted print:text-[8px] print:text-black">
              yerevan.digital
              <br />
              support@yerevan.digital
            </p>
          </div>
          <div className="text-right">
            <p className="font-heading text-2xl font-bold uppercase tracking-wide text-content-primary print:text-[17px] print:text-black">
              Invoice
            </p>
            <p className="mt-1 font-mono text-sm text-content-muted print:text-[10px] print:text-black">
              {invoice.number}
            </p>
            <div className="mt-2 print:hidden">
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="mt-2 hidden font-semibold print:mt-1 print:block print:text-[11px]">{status.label}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 py-6 print:grid-cols-1 print:gap-2 print:py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-content-muted print:text-[8px] print:text-black">
              Bill To
            </p>
            <p className="mt-2 font-semibold text-content-primary print:mt-1 print:text-[11px] print:text-black">
              {storeName}
            </p>
            {store?.email && (
              <p className="text-sm text-content-secondary print:text-[10px] print:text-black">{store.email}</p>
            )}
            {store?.phone && (
              <p className="text-sm text-content-secondary print:text-[10px] print:text-black">{store.phone}</p>
            )}
            {store?.address && (
              <p className="text-sm text-content-secondary print:text-[10px] print:text-black">{store.address}</p>
            )}
          </div>
          <table className="ml-auto w-fit text-sm text-content-primary print:ml-0 print:w-full print:text-[10px] print:text-black">
            <tbody>
              <tr>
                <td className="py-0.5 pr-6 align-top text-xs font-semibold uppercase tracking-wider text-content-muted print:whitespace-nowrap print:py-0 print:pr-4 print:text-[8px] print:text-black">
                  Invoice date
                </td>
                <td className="py-0.5 print:py-0">{formatDate(invoice.created_at)}</td>
              </tr>
              <tr>
                <td className="py-0.5 pr-6 align-top text-xs font-semibold uppercase tracking-wider text-content-muted print:whitespace-nowrap print:py-0 print:pr-4 print:text-[8px] print:text-black">
                  Billing period
                </td>
                <td className="py-0.5 print:whitespace-nowrap print:py-0">
                  {invoice.period_start} &ndash; {invoice.period_end}
                </td>
              </tr>
              {invoice.paid_at && (
                <tr>
                  <td className="py-0.5 pr-6 align-top text-xs font-semibold uppercase tracking-wider text-content-muted print:whitespace-nowrap print:py-0 print:pr-4 print:text-[8px] print:text-black">
                    Paid on
                  </td>
                  <td className="py-0.5 print:py-0">{formatDate(invoice.paid_at)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <table className="w-full border-collapse text-sm print:text-[10px]">
          <thead className="bg-surface-secondary print:bg-white">
            <tr>
              <th className="border-b border-border px-3 py-2 text-left text-xs font-medium text-content-muted print:border print:border-black print:px-2 print:py-1 print:font-bold print:uppercase print:tracking-wider print:text-[8px] print:text-black">
                Description
              </th>
              <th className="border-b border-border px-3 py-2 text-left text-xs font-medium text-content-muted print:border print:border-black print:px-2 print:py-1 print:font-bold print:uppercase print:tracking-wider print:text-[8px] print:text-black">
                Period
              </th>
              <th className="border-b border-border px-3 py-2 text-right text-xs font-medium text-content-muted print:border print:border-black print:px-2 print:py-1 print:font-bold print:uppercase print:tracking-wider print:text-[8px] print:text-black">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="px-3 py-3 align-top text-content-primary print:border print:border-black print:px-2 print:py-2 print:text-black">
                Platform commission &mdash; weekly settlement
              </td>
              <td className="px-3 py-3 align-top text-content-primary print:border print:border-black print:px-2 print:py-2 print:text-black">
                {invoice.period_start} &ndash; {invoice.period_end}
              </td>
              <td className="px-3 py-3 text-right align-top print:whitespace-nowrap print:border print:border-black print:px-2 print:py-2">
                <CurrencyDisplay amount={Number(invoice.amount)} className="text-content-primary print:text-black" />
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t border-border font-semibold print:border-black">
              <td
                className="px-3 py-3 text-right text-content-primary print:whitespace-nowrap print:border print:border-black print:px-2 print:py-2 print:text-black"
                colSpan={2}
              >
                Total due
              </td>
              <td className="px-3 py-3 text-right print:whitespace-nowrap print:border print:border-black print:px-2 print:py-2">
                <CurrencyDisplay
                  amount={Number(invoice.amount)}
                  className="text-base font-bold text-content-primary print:text-[11px] print:text-black"
                />
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-6 rounded-lg border border-border bg-surface-secondary p-4 text-sm text-content-secondary print:mt-4 print:rounded-sm print:border print:border-black print:bg-white print:p-2 print:text-[10px] print:text-black">
          {invoice.status === 'paid' && (
            <p>
              This invoice was <strong className="text-content-primary print:text-black">paid in full</strong> on{' '}
              {formatDate(invoice.paid_at as string)}. No further action is required.
            </p>
          )}
          {invoice.status === 'pending' && (
            <p>
              <strong className="text-content-primary print:text-black">Payment pending.</strong> Please settle this
              invoice online through the seller dashboard (Invoices &rarr; Pay) using the platform&apos;s Telcell
              account.
            </p>
          )}
          {invoice.status === 'void' && <p>This invoice has been voided and is no longer payable.</p>}
        </div>

        <div className="mt-8 border-t border-border pt-4 text-center text-xs text-content-muted print:mt-4 print:border-black print:pt-2 print:text-[8px] print:text-black">
          <p>Yerevan Digital &middot; support@yerevan.digital &middot; yerevan.digital</p>
          <p className="mt-1 print:mt-0">This is a system-generated invoice for platform commission owed on marketplace sales.</p>
        </div>
      </div>
    </div>
  )
}
