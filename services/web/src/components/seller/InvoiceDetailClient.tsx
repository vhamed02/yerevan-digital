'use client'

import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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

const STATUS_LABEL: Record<SellerInvoice['status'], string> = {
  pending: 'Pending',
  paid: 'Paid',
  void: 'Void',
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' })
}

export default function InvoiceDetailClient({ invoice, store }: InvoiceDetailClientProps) {
  const router = useRouter()
  const storeName = store?.name.en || store?.name.hy || ''

  const payMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<PayResponse>(`/seller/invoices/${invoice.uuid}/pay`)
      return res.data
    },
    onSuccess: (data) => redirectToGateway(data.redirect_url, data.form_params),
    onError: () => toast.error('Failed to start the payment'),
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 print:m-0 print:max-w-none print:p-0">
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

      {/* Printable document — styled as plain black-on-white paper so the on-screen
          preview is exactly what prints, independent of "print background graphics". */}
      <div className="border border-black bg-white p-8 text-black sm:p-10 print:border-0 print:p-0">
        <div className="flex items-start justify-between gap-6 border-b-2 border-black pb-6">
          <div>
            <p className="text-xl font-bold">Yerevan Digital</p>
            <p className="mt-1 text-xs leading-relaxed">
              yerevan.digital
              <br />
              support@yerevan.digital
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold uppercase tracking-wide">Invoice</p>
            <p className="mt-1 font-mono text-sm">{invoice.number}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide">Bill To</p>
            <p className="mt-2 font-semibold">{storeName}</p>
            {store?.email && <p className="text-sm">{store.email}</p>}
            {store?.phone && <p className="text-sm">{store.phone}</p>}
            {store?.address && <p className="text-sm">{store.address}</p>}
          </div>
          <table className="w-fit ml-auto text-sm">
            <tbody>
              <tr>
                <td className="pr-6 py-0.5 font-bold uppercase tracking-wide text-xs align-top">Invoice date</td>
                <td className="py-0.5">{formatDate(invoice.created_at)}</td>
              </tr>
              <tr>
                <td className="pr-6 py-0.5 font-bold uppercase tracking-wide text-xs align-top">Billing period</td>
                <td className="py-0.5">
                  {invoice.period_start} &ndash; {invoice.period_end}
                </td>
              </tr>
              <tr>
                <td className="pr-6 py-0.5 font-bold uppercase tracking-wide text-xs align-top">Status</td>
                <td className="py-0.5 font-semibold">{STATUS_LABEL[invoice.status]}</td>
              </tr>
              {invoice.paid_at && (
                <tr>
                  <td className="pr-6 py-0.5 font-bold uppercase tracking-wide text-xs align-top">Paid on</td>
                  <td className="py-0.5">{formatDate(invoice.paid_at)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-black px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">
                Description
              </th>
              <th className="border border-black px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">
                Period
              </th>
              <th className="border border-black px-3 py-2 text-right text-xs font-bold uppercase tracking-wide">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black px-3 py-3 align-top">Platform commission &mdash; weekly settlement</td>
              <td className="border border-black px-3 py-3 align-top">
                {invoice.period_start} &ndash; {invoice.period_end}
              </td>
              <td className="border border-black px-3 py-3 text-right align-top font-mono">
                {Number(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="border border-black px-3 py-3 text-right font-bold" colSpan={2}>
                Total due
              </td>
              <td className="border border-black px-3 py-3 text-right font-mono text-base font-bold">
                {Number(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-6 border border-black p-4 text-sm">
          {invoice.status === 'paid' && (
            <p>
              This invoice was <strong>paid in full</strong> on {formatDate(invoice.paid_at as string)}. No further
              action is required.
            </p>
          )}
          {invoice.status === 'pending' && (
            <p>
              <strong>Payment pending.</strong> Please settle this invoice online through the seller dashboard
              (Invoices &rarr; Pay) using the platform&apos;s Telcell account.
            </p>
          )}
          {invoice.status === 'void' && <p>This invoice has been voided and is no longer payable.</p>}
        </div>

        <div className="mt-8 border-t border-black pt-4 text-center text-xs">
          <p>Yerevan Digital &middot; support@yerevan.digital &middot; yerevan.digital</p>
          <p className="mt-1">This is a system-generated invoice for platform commission owed on marketplace sales.</p>
        </div>
      </div>
    </div>
  )
}
