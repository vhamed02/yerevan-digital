import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const skeletonVariants = cva('animate-pulse bg-surface-tertiary', {
  variants: {
    shape: {
      line: 'h-4 w-full rounded',
      circle: 'rounded-full',
      rectangle: 'rounded-md',
      card: 'h-32 w-full rounded-lg',
    },
  },
  defaultVariants: {
    shape: 'line',
  },
})

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {
  width?: string | number
  height?: string | number
}

function Skeleton({ className, shape, width, height, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ shape }), className)}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...props}
    />
  )
}

export { Skeleton }
export type { SkeletonProps }
