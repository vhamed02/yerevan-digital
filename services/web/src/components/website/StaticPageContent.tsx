import type { Page } from '@/types'

interface StaticPageContentProps {
  page: Page
  locale: string
  bare?: boolean
}

export default function StaticPageContent({ page, locale, bare = false }: StaticPageContentProps) {
  const title = locale === 'en' ? (page.title.en || page.title.hy) : (page.title.hy || page.title.en)
  const content = locale === 'en' ? (page.content.en || page.content.hy) : (page.content.hy || page.content.en)

  const isHtml = content.trimStart().startsWith('<')

  const inner = (
    <>
      <h1 className="mb-8 font-heading text-3xl font-bold tracking-tight text-content-primary sm:text-4xl">
        {title}
      </h1>
      {isHtml ? (
        <div
          className="prose prose-sm max-w-none text-content-primary/80"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {content.split('\n\n').filter(Boolean).map((para, i) => (
            <p key={i} className="text-base leading-relaxed text-content-primary/70 whitespace-pre-line">
              {para}
            </p>
          ))}
        </div>
      )}
    </>
  )

  if (bare) return inner

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {inner}
    </div>
  )
}
