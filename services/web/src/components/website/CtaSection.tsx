import { Link } from '@/i18n/navigation'
import { ArrowRight, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'

export default function CtaSection() {
  const t = useTranslations('cta')

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-[2rem] px-8 py-20 text-center shadow-2xl shadow-brand-500/20 sm:px-16"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #9333ea 100%)' }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-2xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">
              {t('label')}
            </span>

            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              {t('heading')}
            </h2>
            <p className="mt-4 text-lg text-white/70">{t('subheading')}</p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button
                  size="xl"
                  className="group w-full gap-2 bg-white text-brand-700 shadow-lg hover:bg-white/95 sm:w-auto"
                >
                  {t('button')}
                  <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link
                href="/stores"
                className="text-sm font-medium text-white/60 transition-colors hover:text-white/90"
              >
                {t('secondary')} →
              </Link>
            </div>

            <p className="mt-6 inline-flex items-center gap-2 text-sm text-white/45">
              <Check className="h-4 w-4 text-white/60" strokeWidth={2.5} />
              {t('fine_print')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
