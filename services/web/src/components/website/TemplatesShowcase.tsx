import { Link } from '@/i18n/navigation'
import { ArrowRight, Check, Paintbrush } from 'lucide-react'
import { useTranslations } from 'next-intl'

function MinimalPreview() {
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
        <div className="h-2 w-20 rounded-full bg-slate-200" />
        <div className="ml-auto flex gap-2">
          <div className="h-2 w-8 rounded-full bg-slate-100" />
          <div className="h-2 w-8 rounded-full bg-slate-100" />
        </div>
      </div>
      <div className="grid flex-1 grid-cols-3 gap-2.5 p-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="aspect-square rounded-lg bg-slate-100" />
            <div className="h-1.5 w-3/4 rounded-full bg-slate-200" />
            <div className="h-1.5 w-1/2 rounded-full bg-slate-300" />
          </div>
        ))}
      </div>
    </div>
  )
}

function SparkPreview() {
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      <div className="relative h-16 bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500">
        <div className="absolute bottom-2 left-4 h-2.5 w-24 rounded-full bg-white/80" />
        <div className="absolute bottom-2 right-4 h-6 w-16 rounded-full bg-white/90" />
      </div>
      <div className="grid flex-1 grid-cols-3 gap-2.5 p-4">
        {[
          'bg-pink-100',
          'bg-violet-100',
          'bg-amber-100',
          'bg-sky-100',
          'bg-emerald-100',
          'bg-rose-100',
        ].map((bg, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className={`aspect-square rounded-lg ${bg}`} />
            <div className="h-1.5 w-3/4 rounded-full bg-slate-200" />
            <div className="h-1.5 w-1/2 rounded-full bg-brand-300" />
          </div>
        ))}
      </div>
    </div>
  )
}

function CustomPreview() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-surface-secondary to-white p-6">
      <div className="flex items-center gap-2.5">
        {['bg-brand-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'].map((c) => (
          <span key={c} className={`h-8 w-8 rounded-full border-2 border-white shadow-md ${c}`} />
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="font-heading text-2xl font-extrabold text-content-primary">Aa</span>
        <div className="flex gap-2">
          <span className="rounded-md bg-white px-2.5 py-1 text-[10px] font-semibold text-content-primary shadow-sm ring-1 ring-border">
            Inter
          </span>
          <span className="rounded-md bg-white px-2.5 py-1 font-heading text-[10px] font-semibold text-content-primary shadow-sm ring-1 ring-border">
            Jakarta
          </span>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
        <Paintbrush className="h-3 w-3" />
        Live preview
      </span>
    </div>
  )
}

export default function TemplatesShowcase() {
  const t = useTranslations('templates')

  const cards = [
    { Preview: MinimalPreview, name: t('minimal_name'), desc: t('minimal_desc'), ring: 'hover:ring-slate-200' },
    { Preview: SparkPreview, name: t('spark_name'), desc: t('spark_desc'), ring: 'hover:ring-violet-200', featured: true },
    { Preview: CustomPreview, name: t('custom_name'), desc: t('custom_desc'), ring: 'hover:ring-brand-200' },
  ]

  return (
    <section id="templates" className="relative overflow-hidden bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            {t('label')}
            <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {t('badge')}
            </span>
          </span>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-content-primary sm:text-4xl lg:text-5xl">
            {t('heading')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-content-primary/50">{t('subheading')}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map(({ Preview, name, desc, ring, featured }) => (
            <div
              key={name}
              className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm ring-1 ring-transparent transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${ring} ${
                featured ? 'border-violet-200' : 'border-border'
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-surface-secondary">
                <Preview />
                {featured && (
                  <span className="absolute right-3 top-3 rounded-full bg-violet-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                    ★
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5 p-6">
                <h3 className="font-heading text-lg font-bold text-content-primary">{name}</h3>
                <p className="text-sm leading-relaxed text-content-primary/50">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link href="/auth/register">
            <span className="group inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3 text-sm font-semibold text-content-primary shadow-sm transition-all hover:border-brand-200 hover:text-brand-600 hover:shadow-md">
              <Check className="h-4 w-4 text-brand-500" strokeWidth={2.5} />
              {t('cta')}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
