const DATE_LOCALES: Record<string, string> = {
  hy: 'hy-AM',
  en: 'en-US',
  ru: 'ru-RU',
}

export function formatPostDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(DATE_LOCALES[locale] ?? 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso))
}

export function readingTimeMinutes(html: string): number {
  const words = html
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  return Math.max(1, Math.round(words / 200))
}
