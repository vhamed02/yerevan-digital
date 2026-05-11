import { describe, it, expect } from 'vitest'

const STATUS_MAP: Record<string, 'success' | 'warning' | 'error' | 'info' | 'secondary'> = {
  active:     'success',
  paid:       'success',
  delivered:  'success',
  pending:    'warning',
  processing: 'warning',
  suspended:  'error',
  failed:     'error',
  cancelled:  'error',
  draft:      'info',
  shipped:    'info',
}

function getVariant(status: string): string {
  return STATUS_MAP[status.toLowerCase()] ?? 'secondary'
}

describe('StatusBadge mapping', () => {
  it('maps "active" to success variant', () => {
    expect(getVariant('active')).toBe('success')
  })

  it('maps "pending" to warning variant', () => {
    expect(getVariant('pending')).toBe('warning')
  })

  it('maps "suspended" to error variant', () => {
    expect(getVariant('suspended')).toBe('error')
  })

  it('maps "draft" to info variant', () => {
    expect(getVariant('draft')).toBe('info')
  })

  it('maps "paid" to success variant', () => {
    expect(getVariant('paid')).toBe('success')
  })

  it('maps unknown status to secondary variant', () => {
    expect(getVariant('unknown_status')).toBe('secondary')
  })

  it('handles uppercase input', () => {
    expect(getVariant('ACTIVE')).toBe('success')
  })
})
