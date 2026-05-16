import type { Page } from '@/types'

interface StaticPageContentProps {
  page: Page
  locale: string
}

export default function StaticPageContent({ page, locale }: StaticPageContentProps) {
  const title = locale === 'en' ? (page.title.en || page.title.hy) : (page.title.hy || page.title.en)
  const content = locale === 'en' ? (page.content.en || page.content.hy) : (page.content.hy || page.content.en)

  const paragraphs = content.split('\n\n').filter(Boolean)

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-heading text-3xl font-bold tracking-tight text-content-primary sm:text-4xl">
        {title}
      </h1>
      <div className="flex flex-col gap-4">
        {paragraphs.map((para, i) => {
          const lines = para.split('\n')
          if (lines.length === 1) {
            return (
              <p key={i} className="text-base leading-relaxed text-content-primary/70">
                {para}
              </p>
            )
          }
          return (
            <div key={i} className="flex flex-col gap-1">
              {lines.map((line, j) => (
                <p key={j} className={`text-base leading-relaxed ${j === 0 && lines.length > 1 ? 'font-semibold text-content-primary' : 'text-content-primary/70'}`}>
                  {line}
                </p>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
