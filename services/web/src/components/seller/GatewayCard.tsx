import { CheckCircle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { StoreGatewayConfig } from '@/types'

interface GatewayCardProps {
  gateway: StoreGatewayConfig
  onConfigure: (gateway: StoreGatewayConfig) => void
}

export default function GatewayCard({ gateway, onConfigure }: GatewayCardProps) {
  const name = gateway.display_name.hy || gateway.display_name.en || gateway.name

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface overflow-hidden">
      <div className="flex h-24 items-center justify-center bg-surface-secondary p-4">
        <span className="font-heading text-2xl font-bold text-content-primary">{name}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="text-sm font-medium text-content-primary">{name}</p>

        {gateway.is_configured ? (
          <div className="flex items-center gap-1.5 text-sm text-status-success">
            <CheckCircle className="h-4 w-4" />
            {gateway.is_enabled ? 'Configured + Active' : 'Configured (inactive)'}
          </div>
        ) : (
          <p className="text-sm text-content-muted">Not configured</p>
        )}

        <Button
          variant={gateway.is_configured ? 'outline' : 'default'}
          size="sm"
          onClick={() => onConfigure(gateway)}
        >
          <Settings className="h-3.5 w-3.5" />
          {gateway.is_configured ? 'Edit Config' : 'Configure'}
        </Button>
      </div>
    </div>
  )
}
