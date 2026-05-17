'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import GatewayCard from './GatewayCard'
import GatewayConfigModal from './GatewayConfigModal'
import api from '@/lib/api'
import type { StoreGatewayConfig } from '@/types'

interface PaymentsSellerClientProps {
  initialGateways: StoreGatewayConfig[]
}

export default function PaymentsSellerClient({ initialGateways }: PaymentsSellerClientProps) {
  const [configTarget, setConfigTarget] = useState<StoreGatewayConfig | null>(null)

  const { data: gateways } = useQuery({
    queryKey: ['seller-gateways'],
    queryFn: async () => {
      const res = await api.get<StoreGatewayConfig[]>('/seller/payment-gateways')
      return res.data
    },
    initialData: initialGateways,
    staleTime: 60000,
  })

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-content-primary">Payment Gateways</h1>
          <p className="mt-1 text-sm text-content-muted">Let your customers pay online</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gateways.length === 0 ? (
            <div className="col-span-full flex min-h-[200px] items-center justify-center rounded-xl border border-border text-content-muted">
              No payment gateways available
            </div>
          ) : (
            gateways.map((gw) => (
              <GatewayCard key={gw.id} gateway={gw} onConfigure={setConfigTarget} />
            ))
          )}
        </div>
      </div>

      <GatewayConfigModal gateway={configTarget} onClose={() => setConfigTarget(null)} />
    </>
  )
}
