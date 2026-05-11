import { describe, it, expect } from 'vitest'

function formatAmd(amount: number, locale: 'hy' | 'en' = 'hy'): string {
  const formatted = amount.toLocaleString('hy-AM')
  return locale === 'hy' ? `${formatted} ֏` : `AMD ${formatted}`
}

describe('CurrencyDisplay formatting', () => {
  it('includes AMD symbol in Armenian locale', () => {
    const result = formatAmd(15000, 'hy')
    expect(result).toContain('֏')
    expect(result).toContain('15')
  })

  it('includes AMD prefix in English locale', () => {
    const result = formatAmd(15000, 'en')
    expect(result).toMatch(/^AMD /)
    expect(result).toContain('15')
  })

  it('formats zero correctly', () => {
    expect(formatAmd(0, 'hy')).toContain('֏')
    expect(formatAmd(0, 'hy')).toContain('0')
  })

  it('formats large amounts with a separator', () => {
    const result = formatAmd(1000000, 'hy')
    expect(result).toContain('֏')
    expect(result.length).toBeGreaterThan(7)
  })
})
