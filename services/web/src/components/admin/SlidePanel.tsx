'use client'

import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SlidePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  width?: 'sm' | 'md' | 'lg'
}

const widthMap = {
  sm: 'w-80',
  md: 'w-[420px]',
  lg: 'w-[560px]',
}

export default function SlidePanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  width = 'md',
}: SlidePanelProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false)
    }
    if (open) document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed bottom-0 right-0 top-0 z-50 flex flex-col bg-surface shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
            'duration-300',
            widthMap[width]
          )}
        >
          <div className="flex items-start justify-between border-b border-border px-6 py-5">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-base font-semibold text-content-primary">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-content-muted">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                className="rounded-md p-1 text-content-muted hover:bg-surface-secondary hover:text-content-primary transition-colors"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
