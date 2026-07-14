import { serverGet } from '@/lib/server-api'
import { pickLang } from '@/lib/i18n'
import { localePath } from '@/lib/seo'
import { routing } from '@/i18n/routing'
import type { PaginatedResponse, PublicPostListItem } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yerevan.digital'

const FEED_META: Record<string, { title: string; description: string }> = {
  hy: { title: 'Yerevan Digital Բլոգ', description: 'Ուղեցույցներ և խորհուրդներ Հայաստանում առցանց վաճառքի համար' },
  en: { title: 'Yerevan Digital Blog', description: 'Guides and tips for selling online in Armenia' },
  ru: { title: 'Yerevan Digital Блог', description: 'Гайды и советы по онлайн-продажам в Армении' },
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const langParam = url.searchParams.get('lang') ?? routing.defaultLocale
  const lang = (routing.locales as readonly string[]).includes(langParam)
    ? langParam
    : routing.defaultLocale

  const posts = await serverGet<PaginatedResponse<PublicPostListItem>>(
    '/posts?per_page=20',
    { next: { revalidate: 300 } }
  )

  const meta = FEED_META[lang] ?? FEED_META[routing.defaultLocale]
  const feedUrl = `${BASE_URL}/blog/rss.xml${lang === routing.defaultLocale ? '' : `?lang=${lang}`}`
  const blogUrl = `${BASE_URL}${localePath(lang, '/blog')}`

  const items = (posts?.data ?? [])
    .map((post) => {
      const link = `${BASE_URL}${localePath(lang, `/blog/${post.slug}`)}`
      const title = escapeXml(pickLang(post.title, lang))
      const description = escapeXml(pickLang(post.excerpt ?? undefined, lang))
      const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : ''

      return [
        '    <item>',
        `      <title>${title}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        description ? `      <description>${description}</description>` : null,
        pubDate ? `      <pubDate>${pubDate}</pubDate>` : null,
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(meta.title)}</title>`,
    `    <link>${blogUrl}</link>`,
    `    <description>${escapeXml(meta.description)}</description>`,
    `    <language>${lang}</language>`,
    `    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>`,
    items,
    '  </channel>',
    '</rss>',
  ].join('\n')

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
