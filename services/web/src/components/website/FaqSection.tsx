'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'

const KEYS = ['1', '2', '3', '4', '5', '6']

export default function FaqSection() {
  const t = useTranslations('faq')
  const [open, setOpen] = useState<string | null>('1')

  return (
    <section id="faq" className="relative bg-surface-secondary py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <span className="mb-4 inline-block rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            {t('label')}
          </span>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-content-primary sm:text-4xl lg:text-5xl">
            {t('heading')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-content-primary/50">{t('subheading')}</p>
        </div>

        <div className="flex flex-col gap-3">
          {KEYS.map((k) => {
            const isOpen = open === k
            return (
              <div
                key={k}
                className={`overflow-hidden rounded-2xl border bg-white transition-colors ${
                  isOpen ? 'border-brand-200 shadow-sm' : 'border-border'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : k)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-heading text-base font-semibold text-content-primary">
                    {t(`q${k}` as any)}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-content-primary/40 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-brand-500' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm leading-relaxed text-content-primary/60">
                      {t(`a${k}` as any)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
