'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, ShoppingBag, Menu, X } from 'lucide-react'
import { useStoreCart } from '@/stores/cart.store'
import { CartDrawer } from './CartDrawer'
import type { StoreHeaderProps } from '../types'

export function StoreHeader({ store, categories, slug, isPreview }: StoreHeaderProps) {
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    function onScroll() { setScrolled(window.scrollY > 8) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const { getItemCount } = useStoreCart(slug)
  const cartCount = mounted ? getItemCount() : 0
  const name = store.name.hy || store.name.en

  return (
    <>
      <header
        className={`sticky top-0 z-30 bg-white transition-shadow duration-200 ${
          scrolled ? 'shadow-md' : 'border-b border-gray-100'
        }`}
      >
        {isPreview && (
          <div className="w-full bg-amber-400 py-1 text-center text-xs font-medium text-amber-900">
            Preview Mode — changes are not saved
          </div>
        )}

        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          {/* Logo */}
          <Link href={`/store/${slug}`} className="flex flex-shrink-0 items-center gap-3">
            {store.logo_url ? (
              <Image
                src={store.logo_url}
                alt={name}
                width={38}
                height={38}
                className="rounded-xl object-cover"
              />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="hidden font-bold text-gray-900 sm:block">{name}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 overflow-x-auto md:flex">
            <Link
              href={`/store/${slug}/products`}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              Բոլոր ապրանքները
            </Link>
            {categories.slice(0, 5).map((cat) => (
              <Link
                key={cat.id}
                href={`/store/${slug}/products?category=${cat.slug}`}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                {cat.name.hy || cat.name.en}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Link
              href={`/store/${slug}/products?search=1`}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Link>

            <button
              onClick={() => !isPreview && setCartOpen(true)}
              className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
              aria-label={`Cart (${cartCount} items)`}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-50 md:hidden"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-0.5">
              <Link
                href={`/store/${slug}/products`}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Բոլոր ապրանքները
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/store/${slug}/products?category=${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {cat.name.hy || cat.name.en}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} storeSlug={slug} />
    </>
  )
}
