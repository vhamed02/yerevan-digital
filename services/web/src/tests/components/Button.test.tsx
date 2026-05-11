import { describe, it, expect } from 'vitest'
import { buttonVariants } from '@/components/ui/Button'

describe('Button variants', () => {
  it('renders default variant classes', () => {
    const cls = buttonVariants({ variant: 'default' })
    expect(cls).toContain('bg-brand-500')
    expect(cls).toContain('text-white')
  })

  it('renders outline variant classes', () => {
    const cls = buttonVariants({ variant: 'outline' })
    expect(cls).toContain('border')
    expect(cls).toContain('bg-transparent')
  })

  it('renders destructive variant classes', () => {
    const cls = buttonVariants({ variant: 'destructive' })
    expect(cls).toContain('bg-status-error')
  })

  it('renders ghost variant classes', () => {
    const cls = buttonVariants({ variant: 'ghost' })
    expect(cls).toContain('bg-transparent')
  })

  it('applies sm size classes', () => {
    const cls = buttonVariants({ size: 'sm' })
    expect(cls).toContain('h-8')
  })

  it('applies lg size classes', () => {
    const cls = buttonVariants({ size: 'lg' })
    expect(cls).toContain('h-12')
  })
})
