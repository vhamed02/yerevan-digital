import { useTranslations } from 'next-intl'

const STEP_STYLES = [
  {
    numBg: 'bg-brand-500/15 border-brand-500/30 text-brand-400',
    icon: '🏪',
    glow: 'bg-brand-500/10',
  },
  {
    numBg: 'bg-violet-500/15 border-violet-500/30 text-violet-400',
    icon: '📦',
    glow: 'bg-violet-500/10',
  },
  {
    numBg: 'bg-green-500/15 border-green-500/30 text-green-400',
    icon: '💸',
    glow: 'bg-green-500/10',
  },
]

export default function HowItWorks() {
  const t = useTranslations('howItWorks')

  const steps = [
    { number: '01', title: t('step1_title'), description: t('step1_desc'), ...STEP_STYLES[0] },
    { number: '02', title: t('step2_title'), description: t('step2_desc'), ...STEP_STYLES[1] },
    { number: '03', title: t('step3_title'), description: t('step3_desc'), ...STEP_STYLES[2] },
  ]

  return (
    <section className="relative overflow-hidden bg-surface py-24">
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-brand-500/20 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-600">
            {t('label')}
          </span>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-content-primary sm:text-4xl lg:text-5xl">
            {t('heading')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-content-secondary">
            {t('subheading')}
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Connecting line (desktop only) */}
          <div
            className="absolute left-0 right-0 top-10 hidden h-px sm:block"
            style={{
              background: 'linear-gradient(to right, transparent 0%, #e2e8f0 16%, #e2e8f0 84%, transparent 100%)',
            }}
            aria-hidden="true"
          />

          {steps.map((step, i) => (
            <div key={step.number} className="relative flex flex-col items-center gap-5 text-center sm:px-4">
              {/* Step circle */}
              <div className="relative z-10">
                <div className={`flex h-20 w-20 flex-col items-center justify-center rounded-2xl border bg-surface shadow-sm ${step.numBg}`}>
                  <span className="text-2xl leading-none" aria-hidden="true">{step.icon}</span>
                  <span className="mt-1 font-heading text-xs font-bold opacity-60">{step.number}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-heading text-lg font-semibold text-content-primary">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-content-secondary">
                  {step.description}
                </p>
              </div>

              {/* Arrow between steps (mobile) */}
              {i < steps.length - 1 && (
                <div className="flex items-center justify-center sm:hidden">
                  <svg className="h-6 w-6 text-border" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
