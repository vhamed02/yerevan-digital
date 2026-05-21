import Link from 'next/link'
import { Camera, Globe, Mail, Phone, MapPin, ShieldCheck } from 'lucide-react'
import type { StoreFooterProps } from '../types'

export function StoreFooter({ store }: StoreFooterProps) {
  const name = store.name.hy || store.name.en
  const description = store.description?.hy || store.description?.en
  const hasSocial = store.social_instagram || store.social_facebook
  const hasContact = store.email || store.phone || store.address

  return (
    <footer className="mt-24">
      {/* Bold brand bar */}
      <div className="py-14 text-center" style={{ backgroundColor: 'var(--accent)' }}>
        <div className="relative mx-auto max-w-2xl px-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          />
          <p className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Բացահայտե՛ք</p>
          <h2 className="relative mt-2 text-3xl font-black text-white sm:text-4xl">{name}</h2>
          {description && (
            <p className="relative mt-3 text-sm text-white/70">{description}</p>
          )}
          <Link
            href={`/store/${store.slug}/products`}
            className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold shadow-lg transition-all hover:scale-105"
            style={{ color: 'var(--accent)' }}
          >
            Դիտել ապրանքները →
          </Link>
        </div>
      </div>

      {/* Links grid */}
      <div className="bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {/* Brand */}
            <div>
              <p className="text-base font-bold text-white">{name}</p>
              {description && (
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">{description}</p>
              )}
              {hasSocial && (
                <div className="mt-5 flex items-center gap-2.5">
                  {store.social_instagram && (
                    <a
                      href={`https://instagram.com/${store.social_instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-gray-400 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-pink-400 hover:ring-pink-400/30"
                      aria-label="Instagram"
                    >
                      <Camera className="h-4 w-4" />
                    </a>
                  )}
                  {store.social_facebook && (
                    <a
                      href={`https://facebook.com/${store.social_facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-gray-400 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-blue-400 hover:ring-blue-400/30"
                      aria-label="Facebook"
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Բաժիններ</p>
              <nav className="flex flex-col gap-2.5">
                <Link href={`/store/${store.slug}/products`} className="text-sm text-gray-400 transition-colors hover:text-white">
                  Բոլոր ապրանքները
                </Link>
                <Link href={`/store/${store.slug}/products?featured=1`} className="text-sm text-gray-400 transition-colors hover:text-white">
                  Ուշագրավ ապրանքներ
                </Link>
              </nav>
            </div>

            {/* Contact */}
            {hasContact && (
              <div>
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Կապ</p>
                <div className="flex flex-col gap-3">
                  {store.email && (
                    <a href={`mailto:${store.email}`} className="flex items-center gap-2.5 text-sm text-gray-400 transition-colors hover:text-white">
                      <Mail className="h-4 w-4 flex-shrink-0 text-gray-600" />
                      {store.email}
                    </a>
                  )}
                  {store.phone && (
                    <a href={`tel:${store.phone}`} className="flex items-center gap-2.5 text-sm text-gray-400 transition-colors hover:text-white">
                      <Phone className="h-4 w-4 flex-shrink-0 text-gray-600" />
                      {store.phone}
                    </a>
                  )}
                  {store.address && (
                    <p className="flex items-start gap-2.5 text-sm text-gray-400">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600" />
                      {store.address}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 flex flex-col items-center gap-3 border-t border-white/[0.06] pt-8 sm:flex-row sm:justify-between">
            <p className="flex items-center gap-1.5 text-xs text-gray-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              © {new Date().getFullYear()} {name}. Բոլոր իրավունքները պաշտպանված են։
            </p>
            <p className="text-xs text-gray-700">
              Powered by{' '}
              <Link href="/" className="text-gray-500 transition-colors hover:text-white">
                Vendora
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
