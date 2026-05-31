import { describe, it, expect } from 'vitest'
import { localePath, localizedAlternates, ogLocale } from '@/lib/seo'

describe('localePath', () => {
  it('omits the prefix for the default locale (hy)', () => {
    expect(localePath('hy', '/store/acme')).toBe('/store/acme')
  })

  it('prefixes non-default locales', () => {
    expect(localePath('en', '/store/acme')).toBe('/en/store/acme')
    expect(localePath('ru', '/store/acme')).toBe('/ru/store/acme')
  })
})

describe('localizedAlternates', () => {
  it('builds canonical for the current locale', () => {
    expect(localizedAlternates('/store/acme', 'ru').canonical).toBe('/ru/store/acme')
    expect(localizedAlternates('/store/acme', 'hy').canonical).toBe('/store/acme')
  })

  it('lists every locale plus x-default in languages', () => {
    const { languages } = localizedAlternates('/store/acme', 'en')
    expect(languages).toEqual({
      hy: '/store/acme',
      en: '/en/store/acme',
      ru: '/ru/store/acme',
      'x-default': '/store/acme',
    })
  })
})

describe('ogLocale', () => {
  it('maps the active locale and lists the alternates', () => {
    expect(ogLocale('ru')).toEqual({
      locale: 'ru_RU',
      alternateLocale: ['hy_AM', 'en_US'],
    })
  })

  it('uses the default mapping for the default locale', () => {
    expect(ogLocale('hy').locale).toBe('hy_AM')
  })
})
