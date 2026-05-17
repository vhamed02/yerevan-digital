import Link from 'next/link'
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react'
import type { StoreFooterProps } from '../types'

export function StoreFooter({ store }: StoreFooterProps) {
  const name = store.name.hy || store.name.en
  const description = store.description?.hy || store.description?.en
  const hasSocial = store.social_instagram || store.social_facebook
  const hasContact = store.email || store.phone || store.address

  return (
    <footer className="mt-20 border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="text-lg font-bold text-gray-900">{name}</p>
            {description && (
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">{description}</p>
            )}
            {hasSocial && (
              <div className="mt-4 flex items-center gap-3">
                {store.social_instagram && (
                  <a
                    href={`https://instagram.com/${store.social_instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm transition-colors hover:text-pink-500"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {store.social_facebook && (
                  <a
                    href={`https://facebook.com/${store.social_facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm transition-colors hover:text-blue-600"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Բաժիններ
            </p>
            <nav className="flex flex-col gap-2">
              <Link
                href={`/store/${store.slug}/products`}
                className="text-sm text-gray-600 transition-colors hover:text-gray-900"
              >
                Բոլոր ապրանքները
              </Link>
              <Link
                href={`/store/${store.slug}/products?featured=1`}
                className="text-sm text-gray-600 transition-colors hover:text-gray-900"
              >
                Ուշագրավ ապրանքներ
              </Link>
            </nav>
          </div>

          {/* Contact */}
          {hasContact && (
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
                Կապ
              </p>
              <div className="flex flex-col gap-2">
                {store.email && (
                  <a
                    href={`mailto:${store.email}`}
                    className="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
                  >
                    <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    {store.email}
                  </a>
                )}
                {store.phone && (
                  <a
                    href={`tel:${store.phone}`}
                    className="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
                  >
                    <Phone className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    {store.phone}
                  </a>
                )}
                {store.address && (
                  <p className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                    {store.address}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col items-center gap-1 border-t border-gray-200 pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} {name}</p>
          <p className="text-xs text-gray-300">
            Powered by{' '}
            <Link href="/" className="hover:text-gray-400 transition-colors">
              Vendora
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
