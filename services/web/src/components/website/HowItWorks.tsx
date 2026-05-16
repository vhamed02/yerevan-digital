import { useTranslations } from 'next-intl'

const STEPS = [
  { number: '01', bg: 'bg-brand-50', numColor: 'text-brand-600', borderColor: 'border-brand-100', icon: '🏪' },
  { number: '02', bg: 'bg-violet-50', numColor: 'text-violet-600', borderColor: 'border-violet-100', icon: '📦' },
  { number: '03', bg: 'bg-green-50', numColor: 'text-green-600', borderColor: 'border-green-100', icon: '💸' },
]

export default function HowItWorks() {
  const t = useTranslations('howItWorks')

  const steps = STEPS.map((s, i) => ({
    ...s,
    title: t(`step${i + 1}_title` as any),
    description: t(`step${i + 1}_desc` as any),
  }))

  return (
    <section className="relative bg-white py-24">
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

        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Dashed connector line (desktop) */}
          <div className="absolute left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] top-12 hidden h-px border-t-2 border-dashed border-border sm:block" aria-hidden="true" />

          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center sm:px-2">
              {/* Icon circle */}
              <div className={`relative z-10 mb-6 flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 ${step.borderColor} ${step.bg} shadow-sm`}>
                <span className="text-3xl leading-none" aria-hidden="true">{step.icon}</span>
                <span className={`font-heading text-xs font-black ${step.numColor} opacity-70`}>{step.number}</span>
              </div>

              <h3 className="mb-2 font-heading text-lg font-bold text-content-primary">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-content-primary/50">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
