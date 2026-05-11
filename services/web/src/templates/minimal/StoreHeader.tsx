'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, ShoppingBag, Menu, X } from 'lucide-react'
import { useStoreCart } from '@/stores/cart.store'
import { CartDrawer } from './CartDrawer'
import type { StoreHeaderProps } from '../types'

export function StoreHeader({ store, categories, slug, isPreview }: StoreHeaderProps) {
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { getItemCount } = useStoreCart(slug)
  const cartCount = getItemCount()
  const name = store.name.hy || store.name.en

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        {isPreview && (
          <div className="w-full bg-amber-400 py-1 text-center text-xs font-medium text-amber-900">
            Preview Mode — changes are not saved
          </div>
        )}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href={`/store/${slug}`} className="flex items-center gap-3">
            {store.logo_url ? (
              <Image
                src={store.logo_url}
                alt={name}
                width={36}
                height={36}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-xs font-bold text-white">
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="hidden font-semibold text-gray-900 sm:block">{name}</span>
          </Link>

          <nav className="hidden items-center gap-1 overflow-x-auto md:flex">
            <Link
              href={`/store/${slug}/products`}
              className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              All Products
            </Link>
            {categories.slice(0, 5).map((cat) => (
              <Link
                key={cat.id}
                href={`/store/${slug}/products?category=${cat.slug}`}
                className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 whitespace-nowrap"
              >
                {cat.name.hy || cat.name.en}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href={`/store/${slug}/products?search=1`}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Link>
            <button
              onClick={() => !isPreview && setCartOpen(true)}
              className="relative rounded-md p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              aria-label={`Cart (${cartCount} items)`}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-50 md:hidden"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-1">
              <Link
                href={`/store/${slug}/products`}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                All Products
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/store/${slug}/products?category=${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
