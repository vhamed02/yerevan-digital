import type { Metadata } from 'next'
import { ParallaxImage } from '@/components/website/ParallaxImage'
import { PostContent } from '@/components/website/PostContent'
import { CommentSection } from '@/components/website/CommentSection'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ChevronLeft, Clock } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { JsonLd } from '@/components/seo/JsonLd'
import { serverGet } from '@/lib/server-api'
import { pickLang } from '@/lib/i18n'
import { localePath, localizedAlternates, ogLocale } from '@/lib/seo'
import { formatPostDate, readingTimeMinutes } from '@/lib/blog'
import type { PublicPost } from '@/types'

export const revalidate = 300

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yerevan.digital'

function getPost(slug: string): Promise<PublicPost | null> {
  return serverGet<PublicPost>(`/posts/${slug}`, { next: { revalidate: 300 } })
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const locale = await getLocale()
  const post = await getPost(slug)
  if (!post) return { title: 'Yerevan Digital Blog' }

  const title = pickLang(post.meta_title, locale) || pickLang(post.title, locale)
  const description =
    pickLang(post.meta_description, locale) || pickLang(post.excerpt, locale) || undefined
  const og = ogLocale(locale)

  return {
    title: `${title} — Yerevan Digital`,
    description,
    alternates: localizedAlternates(`/blog/${slug}`, locale),
    openGraph: {
      type: 'article',
      title,
      description,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: [post.author_name],
      images: post.cover ? [{ url: post.cover.large }] : undefined,
      locale: og.locale,
      alternateLocale: og.alternateLocale,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.cover ? [post.cover.large] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const locale = await getLocale()
  const t = await getTranslations('blog')
  const post = await getPost(slug)
  if (!post) notFound()

  const title = pickLang(post.title, locale)
  const content = pickLang(post.content, locale)
  const description = pickLang(post.meta_description, locale) || pickLang(post.excerpt, locale)
  const minutes = readingTimeMinutes(content)
  const postUrl = `${BASE_URL}${localePath(locale, `/blog/${slug}`)}`

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: title,
          description: description || undefined,
          image: post.cover ? [post.cover.large] : undefined,
          datePublished: post.published_at ?? undefined,
          dateModified: post.updated_at,
          inLanguage: locale,
          author: { '@type': 'Organization', name: post.author_name },
          publisher: { '@type': 'Organization', name: 'Yerevan Digital', url: BASE_URL },
          mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: t('breadcrumbHome'), item: `${BASE_URL}${localePath(locale, '/')}` },
            { '@type': 'ListItem', position: 2, name: t('title'), item: `${BASE_URL}${localePath(locale, '/blog')}` },
            { '@type': 'ListItem', position: 3, name: title, item: postUrl },
          ],
        }}
      />

      <Link
        href="/blog"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-content-muted transition-colors hover:text-brand-600"
      >
        <ChevronLeft className="h-4 w-4" />
        {t('backToBlog')}
      </Link>

      <article>
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight text-content-primary sm:text-4xl">
            {title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-content-muted">
            <span>{t('by', { name: post.author_name })}</span>
            {post.published_at && <span>{formatPostDate(post.published_at, locale)}</span>}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {t('minRead', { count: minutes })}
            </span>
          </div>
        </header>

        {post.cover && (
          <ParallaxImage
            src={post.cover.large}
            alt={title}
            priority
            sizes="(max-width: 896px) 100vw, 896px"
          />
        )}

        <PostContent
          className="prose max-w-none text-content-primary/85 prose-headings:font-heading prose-headings:text-content-primary prose-a:text-brand-600"
          html={content}
        />
      </article>

      <CommentSection slug={slug} />
    </main>
  )
}
