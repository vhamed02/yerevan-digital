import { AlertTriangle, XCircle } from 'lucide-react'

interface StoreStatusBannerProps {
  status: string
}

export default function StoreStatusBanner({ status }: StoreStatusBannerProps) {
  if (status === 'active') return null

  if (status === 'pending') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          Your store is awaiting approval. You can add products while waiting.
        </p>
      </div>
    )
  }

  if (status === 'suspended') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 px-5 py-4">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-status-error" />
        <p className="text-sm text-status-error">
          Your store has been suspended. Contact{' '}
          <a href="mailto:support@yerevan.digital" className="font-medium underline">
            support@yerevan.digital
          </a>
        </p>
      </div>
    )
  }

  return null
}
