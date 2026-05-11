import Link from 'next/link'
import type { StoreFooterProps } from '../types'

export function StoreFooter({ store }: StoreFooterProps) {
  const name = store.name.hy || store.name.en

  return (
    <footer className="border-t border-stone-200 bg-stone-50 mt-20">
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p
          className="mb-2 text-xl font-bold text-stone-800"
          style={{ fontFamily: 'Georgia, "Playfair Display", serif' }}
        >
          {name}
        </p>
        {store.description && (
          <p className="mb-5 text-sm text-stone-500 max-w-xs mx-auto leading-relaxed">
            {store.description.hy || store.description.en}
          </p>
        )}

        <div className="flex items-center justify-center gap-6">
          {store.social_instagram && (
            <a
              href={`https://instagram.com/${store.social_instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold uppercase tracking-widest text-stone-400 hover:text-stone-700 transition-colors"
            >
              Instagram
            </a>
          )}
          {store.social_facebook && (
            <a
              href={`https://facebook.com/${store.social_facebook}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold uppercase tracking-widest text-stone-400 hover:text-stone-700 transition-colors"
            >
              Facebook
            </a>
          )}
          {store.email && (
            <a
              href={`mailto:${store.email}`}
              className="text-xs font-semibold uppercase tracking-widest text-stone-400 hover:text-stone-700 transition-colors"
            >
              Contact
            </a>
          )}
        </div>

        <p className="mt-8 text-xs text-stone-300">
          Powered by{' '}
          <Link href="/" className="hover:text-stone-400 transition-colors">
            Vendora
          </Link>
        </p>
      </div>
    </footer>
  )
}
