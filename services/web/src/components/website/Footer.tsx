import Link from 'next/link'
import { Store, ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export default function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="border-t border-border bg-surface-secondary">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold text-content-primary">
              <Store className="h-5 w-5 text-brand-500" />
              Vendora
            </Link>
            <p className="text-sm text-content-muted">{t('tagline')}</p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">{t('links_label')}</p>
            <nav className="flex flex-col gap-2">
              {[
                { label: t('about'), href: '/about' },
                { label: t('contact'), href: '/contact' },
                { label: t('terms'), href: '/terms' },
                { label: t('privacy'), href: '/privacy' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-content-secondary hover:text-content-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="pt-1">
              <LanguageSwitcher />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">{t('social_label')}</p>
            <div className="flex flex-col gap-2">
              <a
                href="https://instagram.com/vendora.am"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Instagram
              </a>
              <a
                href="https://facebook.com/vendora.am"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Facebook
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-content-muted">
          {t('copyright')}
        </div>
      </div>
    </footer>
  )
}
