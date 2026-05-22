import { describe, it, expect } from 'vitest'
import { formatViewCount } from '@/lib/formatViewCount'

describe('formatViewCount', () => {
  it('returns the number as-is below 1000', () => {
    expect(formatViewCount(0)).toBe('0')
    expect(formatViewCount(1)).toBe('1')
    expect(formatViewCount(999)).toBe('999')
  })

  it('formats 1000 as 1k', () => {
    expect(formatViewCount(1000)).toBe('1k')
  })

  it('formats 1200 as 1.2k', () => {
    expect(formatViewCount(1200)).toBe('1.2k')
  })

  it('formats 2000 as 2k (no trailing .0)', () => {
    expect(formatViewCount(2000)).toBe('2k')
  })

  it('formats 10500 as 10.5k', () => {
    expect(formatViewCount(10500)).toBe('10.5k')
  })

  it('formats 999999 as 1000k (boundary below M)', () => {
    expect(formatViewCount(999999)).toBe('1000k')
  })

  it('formats 1000000 as 1M', () => {
    expect(formatViewCount(1_000_000)).toBe('1M')
  })

  it('formats 1500000 as 1.5M', () => {
    expect(formatViewCount(1_500_000)).toBe('1.5M')
  })

  it('formats 2000000 as 2M (no trailing .0)', () => {
    expect(formatViewCount(2_000_000)).toBe('2M')
  })
})
