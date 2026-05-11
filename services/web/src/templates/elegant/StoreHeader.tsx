'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { useStoreCart } from '@/stores/cart.store'
import { CartDrawer } from './CartDrawer'
import type { StoreHeaderProps } from '../types'

export function StoreHeader({ store, categories, slug, isPreview }: StoreHeaderProps) {
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { getItemCount } = useStoreCart(slug)
  const cartCount = getItemCount()
  const name = store.name.hy || store.name.en

  return (
    <>
      <header className="border-b border-stone-200 bg-stone-50">
        {isPreview && (
          <div className="w-full bg-amber-400 py-1 text-center text-xs font-medium text-amber-900">
            Preview Mode — changes are not saved
          </div>
        )}

        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-2">
          <div className="flex items-center gap-4">
            {store.social_instagram && (
              <a
                href={`https://instagram.com/${store.social_instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-stone-400 hover:text-stone-600"
              >
                Instagram
              </a>
            )}
            {store.social_facebook && (
              <a
                href={`https://facebook.com/${store.social_facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-stone-400 hover:text-stone-600"
              >
                Facebook
              </a>
            )}
          </div>
          <div className="text-xs text-stone-400">
            {store.phone && <span>{store.phone}</span>}
          </div>
        </div>

        <div className="flex flex-col items-center px-4 py-5">
          <Link href={`/store/${slug}`} className="flex flex-col items-center gap-2">
            {store.logo_url && (
              <Image
                src={store.logo_url}
                alt={name}
                width={48}
                height={48}
                className="rounded-full object-cover ring-1 ring-stone-200"
              />
            )}
            <span
              className="text-2xl font-bold tracking-wide text-stone-800 sm:text-3xl"
              style={{ fontFamily: 'Georgia, "Playfair Display", serif' }}
            >
              {name}
            </span>
          </Link>
        </div>

        <nav className="hidden items-center justify-center gap-1 border-t border-stone-100 px-4 py-2 md:flex">
          <Link
            href={`/store/${slug}`}
            className="px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-stone-500 hover:text-stone-900"
          >
            Home
          </Link>
          <Link
            href={`/store/${slug}/products`}
            className="px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-stone-500 hover:text-stone-900"
          >
            Products
          </Link>
          {categories.slice(0, 4).map((cat) => (
            <Link
              key={cat.id}
              href={`/store/${slug}/products?category=${cat.slug}`}
              className="px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-stone-500 hover:text-stone-900 whitespace-nowrap"
            >
              {cat.name.hy || cat.name.en}
            </Link>
          ))}
          <button
            onClick={() => !isPreview && setCartOpen(true)}
            className="px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-stone-500 hover:text-stone-900"
          >
            BAG ({cartCount})
          </button>
        </nav>

        <div className="flex items-center justify-between border-t border-stone-100 px-4 py-2 md:hidden">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="p-1 text-stone-600"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <button
            onClick={() => !isPreview && setCartOpen(true)}
            className="text-xs font-semibold uppercase tracking-widest text-stone-600"
          >
            BAG ({cartCount})
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-stone-100 bg-stone-50 px-4 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-1">
              {[
                { href: `/store/${slug}`, label: 'Home' },
                { href: `/store/${slug}/products`, label: 'Products' },
                ...categories.map((cat) => ({
                  href: `/store/${slug}/products?category=${cat.slug}`,
                  label: cat.name.hy || cat.name.en,
                })),
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-2 text-xs font-semibold uppercase tracking-widest text-stone-600 hover:text-stone-900"
                >
                  {item.label}
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
