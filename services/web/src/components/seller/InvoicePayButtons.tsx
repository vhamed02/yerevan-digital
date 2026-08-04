'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'
import { redirectToGateway, type InitiateResponse } from '@/lib/payment'

interface InvoicePayButtonsProps {
  uuid: string
  size?: 'sm' | 'md'
}

const GATEWAY_LABELS: Record<string, string> = {
  idram: 'Pay with iDram',
  telcell: 'Pay with Telcell',
}

/**
 * Settle a commission invoice through one of the platform's own merchant
 * accounts. Which accounts are live is a server-side fact (they come from
 * config, not from the seller), so it's fetched rather than hard-coded.
 */
export default function InvoicePayButtons({ uuid, size = 'md' }: InvoicePayButtonsProps) {
  const { data: methods } = useQuery({
    queryKey: ['invoice-payment-methods'],
    queryFn: async () => {
      const res = await api.get<string[]>('/seller/invoices/payment-methods')
      return res.data
    },
    initialData: ['telcell'],
    staleTime: 5 * 60 * 1000,
  })

  const payMutation = useMutation({
    mutationFn: async (gateway: string) => {
      const res = await api.post<InitiateResponse>(`/seller/invoices/${uuid}/pay`, { gateway })
      return res.data
    },
    onSuccess: (data) => redirectToGateway(data.redirect_url, data.form_params),
    onError: () => toast.error('Failed to start the payment'),
  })

  const single = methods.length === 1

  return (
    <>
      {methods.map((gateway, i) => (
        <Button
          key={gateway}
          size={size}
          variant={i === 0 ? 'default' : 'outline'}
          loading={payMutation.isPending && payMutation.variables === gateway}
          disabled={payMutation.isPending}
          onClick={() => payMutation.mutate(gateway)}
        >
          {single ? 'Pay' : (GATEWAY_LABELS[gateway] ?? `Pay with ${gateway}`)}
        </Button>
      ))}
    </>
  )
}
