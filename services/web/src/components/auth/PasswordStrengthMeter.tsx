import { cn } from '@/lib/utils'

type Strength = 'weak' | 'fair' | 'good' | 'strong'

export function getPasswordStrength(password: string): Strength {
  if (password.length < 8) return 'weak'
  const checks = [
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  ].filter(Boolean).length
  if (checks === 0) return 'weak'
  if (checks === 1) return 'fair'
  if (checks === 2) return 'good'
  return 'strong'
}

const CONFIG: Record<Strength, { label: string; filled: number; color: string }> = {
  weak: { label: 'Weak', filled: 1, color: 'bg-status-error' },
  fair: { label: 'Fair', filled: 2, color: 'bg-status-warning' },
  good: { label: 'Good', filled: 3, color: 'bg-status-info' },
  strong: { label: 'Strong', filled: 4, color: 'bg-status-success' },
}

interface PasswordStrengthMeterProps {
  password: string
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null
  const strength = getPasswordStrength(password)
  const { label, filled, color } = CONFIG[strength]

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn('h-1.5 flex-1 rounded-full transition-colors', i < filled ? color : 'bg-surface-tertiary')}
          />
        ))}
      </div>
      <p className={cn('text-xs font-medium', {
        'text-status-error': strength === 'weak',
        'text-status-warning': strength === 'fair',
        'text-status-info': strength === 'good',
        'text-status-success': strength === 'strong',
      })}>
        {label} password
      </p>
    </div>
  )
}
