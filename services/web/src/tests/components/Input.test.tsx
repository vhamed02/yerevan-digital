import { describe, it, expect } from 'vitest'
import { clsx } from 'clsx'

const inputErrorClass = 'border-status-error focus:ring-status-error'
const inputBaseClass  = 'h-10 w-full rounded border border-border'

function buildInputClasses(error?: string): string {
  return clsx(inputBaseClass, error && inputErrorClass)
}

describe('Input error state', () => {
  it('does not apply error classes without error prop', () => {
    const cls = buildInputClasses()
    expect(cls).not.toContain('border-status-error')
  })

  it('applies error classes when error prop is provided', () => {
    const cls = buildInputClasses('Required field')
    expect(cls).toContain('border-status-error')
  })

  it('applies both error classes together', () => {
    const cls = buildInputClasses('Invalid')
    expect(cls).toContain('border-status-error')
    expect(cls).toContain('focus:ring-status-error')
  })
})
