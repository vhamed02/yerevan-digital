'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Receipt } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { EmptyState } from '@/components/ui/EmptyState'
import InvoicePayButtons from './InvoicePayButtons'
import api from '@/lib/api'
import type { InvoiceStatus, PaginatedResponse, SellerInvoice } from '@/types'

interface InvoicesSellerClientProps {
  initialInvoices: SellerInvoice[]
}

function statusOf(status: InvoiceStatus): { label: string; variant: 'success' | 'warning' | 'secondary' } {
  if (status === 'paid') return { label: 'Paid', variant: 'success' }
  if (status === 'void') return { label: 'Void', variant: 'secondary' }
  return { label: 'Pending', variant: 'warning' }
}

export default function InvoicesSellerClient({ initialInvoices }: InvoicesSellerClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (searchParams.get('paid')) {
      toast.success('Invoice paid — thank you!')
    } else if (searchParams.get('failed')) {
      toast.error('Payment failed. Please try again.')
    } else if (searchParams.get('sandbox')) {
      toast.info('Sandbox mode — no real payment was made.')
    } else {
      return
    }
    router.replace(pathname)
    // Only react to the query string present on the initial render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: invoices } = useQuery({
    queryKey: ['seller-invoices'],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<SellerInvoice>>('/seller/invoices')
      return res.data.data
    },
    initialData: initialInvoices,
    staleTime: 30000,
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-heading text-xl font-bold text-content-primary">Invoices</h1>
        <p className="text-sm text-content-muted">
          Weekly platform commission invoices. Pay online to settle your balance.
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            icon={Receipt}
            title="No invoices yet"
            description="Your first weekly commission invoice will appear here once generated."
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border text-left text-content-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Paid at</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const status = statusOf(invoice.status)
                return (
                  <tr key={invoice.uuid} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono font-semibold text-content-primary">
                      <Link href={`/seller/invoices/${invoice.uuid}`} className="text-brand-500 hover:underline">
                        {invoice.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-content-primary">
                      {invoice.period_start} &ndash; {invoice.period_end}
                    </td>
                    <td className="px-4 py-3">
                      <CurrencyDisplay amount={Number(invoice.amount)} className="font-semibold text-content-primary" />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-content-muted">
                      {invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {invoice.is_payable && (
                        <div className="flex justify-end gap-2">
                          <InvoicePayButtons uuid={invoice.uuid} size="sm" />
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
