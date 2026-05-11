import Link from 'next/link'
import { Store, ExternalLink } from 'lucide-react'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface-secondary">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold text-content-primary">
              <Store className="h-5 w-5 text-brand-500" />
              Vendora
            </Link>
            <p className="text-sm text-content-muted">Your Armenian Store Builder</p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">Links</p>
            <nav className="flex flex-col gap-2">
              {[
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/contact' },
                { label: 'Terms of Use', href: '/terms' },
                { label: 'Privacy Policy', href: '/privacy' },
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
            <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">Social</p>
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
          © 2026 Vendora. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
