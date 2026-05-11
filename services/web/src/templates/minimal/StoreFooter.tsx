import Link from 'next/link'
import type { StoreFooterProps } from '../types'

export function StoreFooter({ store }: StoreFooterProps) {
  const name = store.name.hy || store.name.en
  const description = store.description?.hy || store.description?.en

  return (
    <footer className="border-t border-gray-100 bg-white mt-16">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="font-semibold text-gray-900">{name}</p>
          {description && <p className="max-w-sm text-sm text-gray-500">{description}</p>}

          <div className="flex items-center gap-4">
            {store.social_instagram && (
              <a
                href={`https://instagram.com/${store.social_instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Instagram
              </a>
            )}
            {store.social_facebook && (
              <a
                href={`https://facebook.com/${store.social_facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Facebook
              </a>
            )}
            {store.email && (
              <a
                href={`mailto:${store.email}`}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {store.email}
              </a>
            )}
          </div>

          <p className="text-xs text-gray-300">
            Powered by{' '}
            <Link href="/" className="hover:text-gray-400">
              Vendora
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
