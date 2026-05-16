import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'

export default function HeroSection() {
  const t = useTranslations('hero')

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-16 px-4 py-20 sm:px-6 lg:flex-row lg:px-8">
        <div className="flex flex-1 flex-col gap-8 text-center lg:text-left">
          <div className="flex flex-col gap-4">
            <span className="inline-flex self-center rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white lg:self-start">
              {t('badge')}
            </span>
            <h1 className="font-heading text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              {t('title')}<br />
              <span className="text-white/80">{t('title_highlight')}</span><br />
              {t('title_end')}
            </h1>
            <p className="text-lg text-white/70 lg:max-w-lg">
              {t('subtitle')}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/auth/register">
              <Button size="lg" className="w-full bg-white text-brand-700 hover:bg-white/90 sm:w-auto">
                {t('cta_primary')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/stores">
              <Button size="lg" variant="ghost" className="w-full border border-white/30 text-white hover:bg-white/10 sm:w-auto">
                {t('cta_secondary')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <StorefrontIllustration
            storesLabel={t('badge_stores')}
            productsLabel={t('badge_products')}
            happyLabel={t('badge_happy')}
          />
        </div>
      </div>
    </section>
  )
}

function StorefrontIllustration({
  storesLabel,
  productsLabel,
  happyLabel,
}: {
  storesLabel: string
  productsLabel: string
  happyLabel: string
}) {
  return (
    <div className="relative h-80 w-80 sm:h-96 sm:w-96">
      <svg viewBox="0 0 400 360" className="h-full w-full drop-shadow-2xl" aria-hidden="true">
        <rect x="60" y="140" width="280" height="200" rx="12" fill="white" fillOpacity="0.12" />
        <path d="M40 140 L200 80 L360 140" fill="white" fillOpacity="0.18" />
        <rect x="80" y="100" width="240" height="40" rx="6" fill="white" fillOpacity="0.25" />
        <rect x="80" y="165" width="100" height="70" rx="6" fill="white" fillOpacity="0.12" />
        <rect x="220" y="165" width="100" height="70" rx="6" fill="white" fillOpacity="0.12" />
        <rect x="155" y="255" width="90" height="85" rx="6" fill="white" fillOpacity="0.18" />
        <circle cx="200" cy="100" r="8" fill="white" fillOpacity="0.7" />
        <text x="152" y="118" textAnchor="middle" fill="white" fillOpacity="0.9" fontSize="13" fontWeight="600" fontFamily="sans-serif">Vendora Shop</text>
        <rect x="90" y="175" width="80" height="50" rx="4" fill="white" fillOpacity="0.08" />
        <rect x="230" y="175" width="80" height="50" rx="4" fill="white" fillOpacity="0.08" />
      </svg>

      <div className="absolute -right-4 top-8 flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm">
        <span className="text-base">🏪</span>
        {storesLabel}
      </div>
      <div className="absolute -left-4 top-1/3 flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm">
        <span className="text-base">📦</span>
        {productsLabel}
      </div>
      <div className="absolute -right-2 bottom-12 flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm">
        <span className="text-base">⭐</span>
        {happyLabel}
      </div>
    </div>
  )
}
