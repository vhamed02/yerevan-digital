import { Link } from '@/i18n/navigation'
import { ExternalLink, Heart } from 'lucide-react'
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" width={24} height={24} className="h-6 w-6" />
              Yerevan Digital
            </Link>
            <p className="text-sm text-content-muted">{t('tagline')}</p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">{t('links_label')}</p>
            <nav className="flex flex-col gap-2">
              {[
                { label: t('blog'), href: '/blog' },
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
            <div className="w-fit pt-1">
              <LanguageSwitcher />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">{t('social_label')}</p>
            <div className="flex flex-col gap-2">
              <a
                href="https://instagram.com/yerevan.digital"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-content-secondary hover:text-content-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Instagram
              </a>
              <a
                href="https://facebook.com/yerevan.digital"
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

        <div className="mt-10 flex flex-col items-center gap-1 border-t border-border pt-6 text-center text-sm text-content-muted">
          <p>{t('copyright')}</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-4 w-4 fill-red-500 text-red-500" /> by
            <a
              href="https://www.linkedin.com/in/hamed-najari/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-content-secondary hover:text-content-primary transition-colors"
            >
              Hamed Najari
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
