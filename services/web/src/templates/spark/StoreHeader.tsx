'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { Search, ShoppingBag, Menu, X, ChevronDown } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useStoreCart } from '@/stores/cart.store'
import { pickLang } from '@/lib/i18n'
import { CartDrawer } from './CartDrawer'
import type { StoreHeaderProps } from '../types'

export function StoreHeader({ store, categories, slug, isPreview }: StoreHeaderProps) {
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    function onScroll() { setScrolled(window.scrollY > 40) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const { getItemCount } = useStoreCart(slug)
  const locale = useLocale()
  const t = useTranslations('storefront')
  const cartCount = mounted ? getItemCount() : 0
  const name = pickLang(store.name, locale)
  const announcementText = store.template_config?.announcement_text

  return (
    <>
      <header className="sticky top-0 z-30">
        {announcementText && (
          <div
            className="w-full py-2 text-center text-xs font-medium tracking-wide text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {announcementText}
          </div>
        )}

        {isPreview && (
          <div className="w-full bg-amber-400 py-1 text-center text-xs font-medium text-amber-900">
            Preview Mode — changes are not saved
          </div>
        )}

        <div
          className={`transition-all duration-300 ${
            scrolled
              ? 'bg-white/90 shadow-[0_1px_24px_rgba(0,0,0,0.08)] backdrop-blur-md'
              : 'bg-white border-b border-gray-100'
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
            <Link href={`/store/${slug}`} className="flex flex-shrink-0 items-center gap-3 group">
              {store.logo_url ? (
                <Image
                  src={store.logo_url}
                  alt={name}
                  width={36}
                  height={36}
                  className="rounded-xl object-cover transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white transition-transform duration-200 group-hover:scale-105"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="hidden font-bold tracking-tight text-gray-900 sm:block">{name}</span>
            </Link>

            <nav className="hidden items-center md:flex">
              <Link
                href={`/store/${slug}/products`}
                className="relative px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-px after:bg-[var(--accent)] after:scale-x-0 after:transition-transform hover:after:scale-x-100"
              >
                {t('allProducts')}
              </Link>
              {categories.slice(0, 5).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/store/${slug}/products?category=${cat.slug}`}
                  className="relative whitespace-nowrap px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-px after:bg-[var(--accent)] after:scale-x-0 after:transition-transform hover:after:scale-x-100"
                >
                  {pickLang(cat.name, locale)}
                </Link>
              ))}
              {categories.length > 5 && (
                <button className="flex items-center gap-0.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900">
                  {t('more')} <ChevronDown className="h-3.5 w-3.5" />
                </button>
              )}
            </nav>

            <div className="flex items-center gap-1">
              <Link
                href={`/store/${slug}/products?search=1`}
                className="rounded-xl p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Search"
              >
                <Search className="h-[18px] w-[18px]" />
              </Link>

              <button
                onClick={() => !isPreview && setCartOpen(true)}
                className="relative rounded-xl p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label={`Cart (${cartCount} items)`}
              >
                <ShoppingBag className="h-[18px] w-[18px]" />
                {cartCount > 0 && (
                  <span
                    className="absolute right-1 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white transition-transform"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="rounded-xl p-2.5 text-gray-500 transition-colors hover:bg-gray-100 md:hidden"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 md:hidden ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        <div
          className={`absolute inset-y-0 right-0 w-72 bg-white shadow-2xl transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <span className="font-bold text-gray-900">{name}</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col px-3 py-3">
            <Link
              href={`/store/${slug}/products`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center rounded-xl px-3 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
            >
              {t('allProducts')}
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/store/${slug}/products?category=${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                {pickLang(cat.name, locale)}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} storeSlug={slug} />
    </>
  )
}
