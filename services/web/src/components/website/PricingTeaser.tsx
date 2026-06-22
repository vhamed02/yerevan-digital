import { Link } from '@/i18n/navigation'
import { Check, ArrowRight, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'

export default function PricingTeaser() {
  const t = useTranslations('pricing')

  const starterFeatures = [
    t('feature_url'),
    t('feature_products'),
    t('feature_payments'),
    t('feature_multilang'),
    t('feature_templates'),
  ]
  const businessFeatures = [t('business_f1'), t('business_f2'), t('business_f3')]

  return (
    <section id="pricing" className="relative bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            {t('label')}
          </span>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-content-primary sm:text-4xl lg:text-5xl">
            {t('heading')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-content-primary/50">{t('subheading')}</p>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 items-start gap-6 lg:grid-cols-5">
          <div className="relative overflow-hidden rounded-3xl border-2 border-brand-500 bg-white p-8 shadow-xl shadow-brand-200/50 lg:col-span-3">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-50 blur-3xl"
              style={{ background: 'radial-gradient(circle, #e0e7ff 0%, transparent 70%)' }}
              aria-hidden="true"
            />
            <div className="relative">
              <div className="mb-5 flex items-center justify-between">
                <span className="font-heading text-lg font-bold text-content-primary">{t('starter_name')}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  <Sparkles className="h-3 w-3" />
                  {t('starter_badge')}
                </span>
              </div>

              <div className="flex items-end gap-1">
                <span className="font-heading text-5xl font-extrabold tracking-tight text-content-primary">
                  {t('starter_price')}
                </span>
                <span className="mb-2 text-sm font-medium text-content-primary/45">{t('starter_period')}</span>
              </div>
              <p className="mt-2 text-sm text-content-primary/55">{t('starter_tagline')}</p>

              <ul className="mt-7 flex flex-col gap-3.5">
                {starterFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-content-primary/75">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100">
                      <Check className="h-3 w-3 text-brand-600" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/auth/register" className="mt-8 block">
                <Button size="lg" className="group w-full gap-2 shadow-lg shadow-brand-500/25">
                  {t('starter_cta')}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex h-full flex-col rounded-3xl border border-border bg-surface-secondary p-8 lg:col-span-2">
            <span className="font-heading text-lg font-bold text-content-primary">{t('business_name')}</span>
            <div className="mt-4 flex items-end gap-1">
              <span className="font-heading text-3xl font-extrabold tracking-tight text-content-primary">
                {t('business_price')}
              </span>
            </div>
            <p className="mt-2 text-sm text-content-primary/55">{t('business_tagline')}</p>

            <ul className="mt-7 flex flex-1 flex-col gap-3.5">
              {businessFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-content-primary/75">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100">
                    <Check className="h-3 w-3 text-violet-600" strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/contact" className="mt-8 block">
              <Button size="lg" variant="outline" className="w-full bg-white">
                {t('business_cta')}
              </Button>
            </Link>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-sm text-content-primary/40">{t('note')}</p>
      </div>
    </section>
  )
}
