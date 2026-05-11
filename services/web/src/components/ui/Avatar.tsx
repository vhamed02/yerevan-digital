import Image from 'next/image'
import { cn } from '@/lib/utils'

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
}

interface AvatarProps {
  src?: string | null
  name?: string
  size?: keyof typeof sizeMap
  className?: string
}

function getInitials(name?: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-medium text-brand-700',
        sizeMap[size],
        className
      )}
      aria-label={name}
    >
      {src ? (
        <Image src={src} alt={name ?? ''} fill className="object-cover" sizes="80px" />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
    </div>
  )
}

export { Avatar }
export type { AvatarProps }
