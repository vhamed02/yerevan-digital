/**
 * The API stores commission rates as decimal fractions ("0.0500"), matching the
 * decimal(5,4) column. Admins think in percent. These convert between the two.
 */

/** "0.0500" -> "5%" for display. */
export function formatRate(rate: string | null | undefined): string {
  if (rate === null || rate === undefined || rate === '') return '—'
  const pct = Number(rate) * 100
  if (!Number.isFinite(pct)) return '—'
  return `${Number(pct.toFixed(4))}%`
}

/** "0.0500" -> "5" for prefilling a percent input. */
export function fractionToPercent(rate: string | null | undefined): string {
  if (rate === null || rate === undefined || rate === '') return ''
  const pct = Number(rate) * 100
  if (!Number.isFinite(pct)) return ''
  return String(Number(pct.toFixed(4)))
}

/** "5" -> "0.0500". Fixed at 4dp to match the column and avoid float artefacts. */
export function percentToFraction(percent: string): string {
  return (Number(percent) / 100).toFixed(4)
}

/** Signed ledger amount as a number, for currency display. */
export function amountToNumber(amount: string): number {
  const n = Number(amount)
  return Number.isFinite(n) ? n : 0
}
