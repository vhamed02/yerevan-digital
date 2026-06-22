import { Star, Quote } from 'lucide-react'
import { useTranslations } from 'next-intl'

const ITEMS = [
  { key: 't1', initial: 'Ա', bg: 'bg-brand-100', text: 'text-brand-700' },
  { key: 't2', initial: 'Դ', bg: 'bg-violet-100', text: 'text-violet-700' },
  { key: 't3', initial: 'Մ', bg: 'bg-pink-100', text: 'text-pink-700' },
]

export default function Testimonials() {
  const t = useTranslations('testimonials')

  return (
    <section className="relative overflow-hidden bg-surface-secondary py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 0%, #eef2ff 0%, transparent 55%)',
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            {t('label')}
          </span>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-content-primary sm:text-4xl lg:text-5xl">
            {t('heading')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-content-primary/50">{t('subheading')}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {ITEMS.map(({ key, initial, bg, text }) => (
            <figure
              key={key}
              className="relative flex flex-col gap-5 rounded-2xl border border-border bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <Quote className="h-8 w-8 text-brand-100" fill="currentColor" />
              <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="flex-1 text-base leading-relaxed text-content-primary/75">
                “{t(`${key}_quote` as any)}”
              </blockquote>
              <figcaption className="flex items-center gap-3 border-t border-border pt-5">
                <span className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-bold ${bg} ${text}`}>
                  {initial}
                </span>
                <div>
                  <p className="font-heading text-sm font-bold text-content-primary">{t(`${key}_name` as any)}</p>
                  <p className="text-xs text-content-primary/45">{t(`${key}_role` as any)}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
