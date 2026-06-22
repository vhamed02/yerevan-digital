import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

const STEPS = [
  {
    number: '01',
    icon: '🏪',
    iconBg: 'bg-brand-50',
    ring: 'ring-brand-100',
    badge: 'bg-brand-500',
    glow: 'group-hover:shadow-brand-200/70',
  },
  {
    number: '02',
    icon: '📦',
    iconBg: 'bg-violet-50',
    ring: 'ring-violet-100',
    badge: 'bg-violet-500',
    glow: 'group-hover:shadow-violet-200/70',
  },
  {
    number: '03',
    icon: '💸',
    iconBg: 'bg-emerald-50',
    ring: 'ring-emerald-100',
    badge: 'bg-emerald-500',
    glow: 'group-hover:shadow-emerald-200/70',
  },
]

export default function HowItWorks() {
  const t = useTranslations('howItWorks')

  const steps = STEPS.map((s, i) => ({
    ...s,
    title: t(`step${i + 1}_title` as any),
    description: t(`step${i + 1}_desc` as any),
  }))

  return (
    <section className="relative bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            {t('label')}
          </span>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-content-primary sm:text-4xl lg:text-5xl">
            {t('heading')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-content-primary/50">
            {t('subheading')}
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-5">
          {steps.map((step, i) => (
            <div key={step.number} className="relative flex">
              <div
                className={`group relative flex w-full flex-col items-center rounded-2xl border border-border bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${step.glow}`}
              >
                <span
                  className={`absolute -top-3 right-6 rounded-full px-2.5 py-1 font-heading text-xs font-black tracking-wider text-white ${step.badge}`}
                >
                  {step.number}
                </span>
                <div
                  className={`mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ring-8 transition-transform duration-300 group-hover:scale-105 ${step.iconBg} ${step.ring}`}
                >
                  <span className="text-4xl leading-none" aria-hidden="true">
                    {step.icon}
                  </span>
                </div>
                <h3 className="mb-2 font-heading text-lg font-bold text-content-primary">{step.title}</h3>
                <p className="text-sm leading-relaxed text-content-primary/50">{step.description}</p>
              </div>

              {i < steps.length - 1 && (
                <div
                  className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 sm:block"
                  aria-hidden="true"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white shadow-sm">
                    <ArrowRight className="h-4 w-4 text-content-primary/40" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
