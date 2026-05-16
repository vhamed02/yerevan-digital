import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'

export default function CtaSection() {
  const t = useTranslations('cta')

  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-surface-dark px-8 py-16 text-center sm:px-16">
          {/* Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_120%,rgba(99,102,241,0.3),transparent)]" />
          {/* Top border glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

          <div className="relative mx-auto max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
              {t('label')}
            </div>

            <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-5xl">
              {t('heading')}
            </h2>
            <p className="mt-4 text-lg text-white/45">
              {t('subheading')}
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/auth/register">
                <Button
                  size="xl"
                  className="group w-full bg-brand-500 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 sm:w-auto"
                >
                  {t('button')}
                  <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/stores" className="text-sm font-medium text-white/40 hover:text-white/70 transition-colors">
                {t('secondary')} →
              </Link>
            </div>

            <p className="mt-6 text-sm text-white/25">{t('fine_print')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
