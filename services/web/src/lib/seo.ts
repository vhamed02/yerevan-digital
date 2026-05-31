import { routing } from '@/i18n/routing'

const OG_LOCALES: Record<string, string> = {
  hy: 'hy_AM',
  en: 'en_US',
  ru: 'ru_RU',
}

export function localePath(locale: string, path: string): string {
  return locale === routing.defaultLocale ? path : `/${locale}${path}`
}

export function localizedAlternates(
  path: string,
  locale: string,
): { canonical: string; languages: Record<string, string> } {
  const languages: Record<string, string> = {}
  for (const l of routing.locales) {
    languages[l] = localePath(l, path)
  }
  languages['x-default'] = localePath(routing.defaultLocale, path)

  return {
    canonical: localePath(locale, path),
    languages,
  }
}

export function ogLocale(locale: string): { locale: string; alternateLocale: string[] } {
  return {
    locale: OG_LOCALES[locale] ?? OG_LOCALES[routing.defaultLocale],
    alternateLocale: routing.locales
      .filter((l) => l !== locale)
      .map((l) => OG_LOCALES[l]),
  }
}
