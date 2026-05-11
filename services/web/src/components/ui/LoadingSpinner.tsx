import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

interface LoadingSpinnerProps {
  size?: keyof typeof sizeMap
  className?: string
}

function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)} role="status" aria-label="Loading">
      <Loader2 className={cn('animate-spin text-brand-500', sizeMap[size])} />
    </div>
  )
}

export { LoadingSpinner }
export type { LoadingSpinnerProps }
