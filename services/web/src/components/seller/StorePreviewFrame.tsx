'use client'

import { useState } from 'react'
import { RefreshCw, Smartphone, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StorePreviewFrameProps {
  storeSlug: string
  previewParams: Record<string, string>
}

export default function StorePreviewFrame({ storeSlug, previewParams }: StorePreviewFrameProps) {
  const [mobile, setMobile] = useState(false)
  const [key, setKey] = useState(0)

  const params = new URLSearchParams({ preview: 'true', ...previewParams })
  const src = `/store/${storeSlug}?${params.toString()}`

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
        <p className="text-xs text-content-muted truncate">vendora.am/store/{storeSlug}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setKey((k) => k + 1)}
            className="rounded p-1.5 text-content-muted hover:bg-surface-secondary hover:text-content-primary transition-colors"
            aria-label="Refresh preview"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMobile(false)}
            className={cn(
              'rounded p-1.5 transition-colors',
              !mobile
                ? 'text-brand-500 bg-brand-50'
                : 'text-content-muted hover:bg-surface-secondary hover:text-content-primary'
            )}
            aria-label="Desktop view"
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMobile(true)}
            className={cn(
              'rounded p-1.5 transition-colors',
              mobile
                ? 'text-brand-500 bg-brand-50'
                : 'text-content-muted hover:bg-surface-secondary hover:text-content-primary'
            )}
            aria-label="Mobile view"
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex flex-1 items-start justify-center overflow-auto bg-surface-secondary p-4">
        <iframe
          key={key}
          src={src}
          className={cn(
            'bg-surface shadow-lg rounded-lg border border-border transition-all duration-300',
            mobile ? 'h-[667px] w-[375px]' : 'h-full w-full min-h-[600px]'
          )}
          title="Store Preview"
        />
      </div>
    </div>
  )
}
