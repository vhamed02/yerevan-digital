'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Menu, X } from 'lucide-react'
import { useStoreCart } from '@/stores/cart.store'
import { CartDrawer } from './CartDrawer'
import type { StoreHeaderProps } from '../types'

export function StoreHeader({ store, categories, slug, isPreview }: StoreHeaderProps) {
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { getItemCount } = useStoreCart(slug)
  const cartCount = getItemCount()
  const name = store.name.hy || store.name.en
  const primary = store.template_config.primary_color || '#6366f1'

  return (
    <>
      <header className="sticky top-0 z-30" style={{ backgroundColor: primary }}>
        {isPreview && (
          <div className="w-full bg-amber-400 py-1 text-center text-xs font-medium text-amber-900">
            Preview Mode — changes are not saved
          </div>
        )}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href={`/store/${slug}`} className="flex items-center gap-3">
            {store.logo_url ? (
              <Image
                src={store.logo_url}
                alt={name}
                width={40}
                height={40}
                className="rounded-lg object-cover ring-2 ring-white/30"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-sm font-bold text-white">
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="hidden text-lg font-extrabold text-white tracking-tight sm:block">{name}</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href={`/store/${slug}/products`}
              className="rounded px-3 py-1.5 text-sm font-bold text-white/90 hover:bg-white/10 hover:text-white"
            >
              ALL
            </Link>
            {categories.slice(0, 5).map((cat) => (
              <Link
                key={cat.id}
                href={`/store/${slug}/products?category=${cat.slug}`}
                className="rounded px-3 py-1.5 text-sm font-bold text-white/90 hover:bg-white/10 hover:text-white whitespace-nowrap"
              >
                {(cat.name.hy || cat.name.en).toUpperCase()}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => !isPreview && setCartOpen(true)}
              className="relative rounded-lg p-2 text-white hover:bg-white/10"
              aria-label={`Cart (${cartCount} items)`}
            >
              <ShoppingBag className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-extrabold" style={{ color: primary }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded-lg p-2 text-white hover:bg-white/10 md:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/20 px-4 pb-4 pt-2 md:hidden" style={{ backgroundColor: primary }}>
            <nav className="flex flex-col gap-1">
              <Link
                href={`/store/${slug}/products`}
                onClick={() => setMobileOpen(false)}
                className="rounded px-3 py-2 text-sm font-bold text-white hover:bg-white/10"
              >
                ALL PRODUCTS
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/store/${slug}/products?category=${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded px-3 py-2 text-sm font-bold text-white hover:bg-white/10"
                >
                  {(cat.name.hy || cat.name.en).toUpperCase()}
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
