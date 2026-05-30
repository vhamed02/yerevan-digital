import type { MultiLang } from '@/types'

export type Locale = 'hy' | 'en' | 'ru'

/**
 * Pick the best translation from a MultiLang field for the active locale.
 *
 * Fallback chain: requested locale → English → Armenian → first non-empty value.
 * English is the canonical key (used for slugs), so it is the safest universal
 * fallback when the requested locale is missing.
 *
 * Accepts a possibly-undefined field and an arbitrary locale string (e.g. from
 * next-intl's `useLocale()`), and always returns a string ('' if nothing is set).
 */
export function pickLang(field: MultiLang | null | undefined, locale: string): string {
  if (!field) return ''
  const order: Locale[] = ['en', 'hy']
  const preferred = locale as Locale
  const chain: Locale[] = [preferred, ...order.filter((l) => l !== preferred)]

  for (const l of chain) {
    const value = field[l]
    if (value) return value
  }

  // Last resort: any non-empty value present on the object.
  for (const value of Object.values(field)) {
    if (value) return value
  }
  return ''
}
