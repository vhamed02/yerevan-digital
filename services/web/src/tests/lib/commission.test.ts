import { describe, it, expect } from 'vitest'
import {
  formatRate,
  fractionToPercent,
  percentToFraction,
  amountToNumber,
} from '@/lib/commission'

describe('formatRate', () => {
  it('renders a decimal fraction as a percentage', () => {
    expect(formatRate('0.0500')).toBe('5%')
    expect(formatRate('0.0250')).toBe('2.5%')
    expect(formatRate('0.1000')).toBe('10%')
  })

  it('does not leak float artefacts into the label', () => {
    // 0.07 * 100 is 7.000000000000001 in binary floating point.
    expect(formatRate('0.0700')).toBe('7%')
  })

  it('renders a dash when no rate is set', () => {
    expect(formatRate(null)).toBe('—')
    expect(formatRate(undefined)).toBe('—')
    expect(formatRate('')).toBe('—')
  })

  it('renders a dash for a non-numeric rate', () => {
    expect(formatRate('abc')).toBe('—')
  })
})

describe('fractionToPercent', () => {
  it('converts a stored rate into a percent input value', () => {
    expect(fractionToPercent('0.0500')).toBe('5')
    expect(fractionToPercent('0.0250')).toBe('2.5')
  })

  it('returns an empty string when the store inherits the default', () => {
    expect(fractionToPercent(null)).toBe('')
    expect(fractionToPercent(undefined)).toBe('')
  })
})

describe('percentToFraction', () => {
  it('converts a typed percentage into the decimal(5,4) the API expects', () => {
    expect(percentToFraction('5')).toBe('0.0500')
    expect(percentToFraction('2.5')).toBe('0.0250')
    expect(percentToFraction('0')).toBe('0.0000')
  })

  it('clamps to 4 decimal places rather than emitting a float artefact', () => {
    expect(percentToFraction('3.33')).toBe('0.0333')
  })

  it('maps 100% to the maximum the API accepts', () => {
    expect(percentToFraction('100')).toBe('1.0000')
  })

  it('round-trips with fractionToPercent', () => {
    expect(fractionToPercent(percentToFraction('7.5'))).toBe('7.5')
  })
})

describe('amountToNumber', () => {
  it('parses signed ledger amounts', () => {
    expect(amountToNumber('750.00')).toBe(750)
    expect(amountToNumber('-750.00')).toBe(-750)
  })

  it('falls back to zero for a non-numeric amount', () => {
    expect(amountToNumber('')).toBe(0)
    expect(amountToNumber('abc')).toBe(0)
  })
})
