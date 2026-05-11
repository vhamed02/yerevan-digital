import Link from 'next/link'
import type { StoreFooterProps } from '../types'

export function StoreFooter({ store }: StoreFooterProps) {
  const name = store.name.hy || store.name.en

  return (
    <footer className="bg-gray-950 mt-16 text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <p className="mb-3 text-lg font-extrabold tracking-tight">{name}</p>
            {store.description && (
              <p className="text-sm text-gray-400 leading-relaxed">
                {store.description.hy || store.description.en}
              </p>
            )}
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Shop</p>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href={`/store/${store.slug}/products`} className="text-sm text-gray-300 hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Contact</p>
            <ul className="flex flex-col gap-2 text-sm text-gray-300">
              {store.email && <li><a href={`mailto:${store.email}`} className="hover:text-white transition-colors">{store.email}</a></li>}
              {store.phone && <li>{store.phone}</li>}
              {store.address && <li>{store.address}</li>}
              {store.social_instagram && (
                <li>
                  <a href={`https://instagram.com/${store.social_instagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Instagram
                  </a>
                </li>
              )}
              {store.social_facebook && (
                <li>
                  <a href={`https://facebook.com/${store.social_facebook}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Facebook
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-gray-800 pt-6 text-center text-xs text-gray-600">
          Powered by{' '}
          <Link href="/" className="hover:text-gray-400 transition-colors">
            Vendora
          </Link>
        </div>
      </div>
    </footer>
  )
}
