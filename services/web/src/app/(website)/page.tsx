import type { Metadata } from 'next'
import { Suspense } from 'react'
import HeroSection from '@/components/website/HeroSection'
import HowItWorks from '@/components/website/HowItWorks'
import FeaturesSection from '@/components/website/FeaturesSection'
import FeaturedStores from '@/components/website/FeaturedStores'
import StatsBar from '@/components/website/StatsBar'
import CtaSection from '@/components/website/CtaSection'
import { getLocale, getTranslations } from 'next-intl/server'
import { serverGet } from '@/lib/server-api'
import { localizedAlternates, ogLocale } from '@/lib/seo'
import type { PlatformStats } from '@/types'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations('seo')
  const title = t('home.title')
  const description = t('home.description')
  return {
    title,
    description,
    alternates: localizedAlternates('/', locale),
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Vendora',
      ...ogLocale(locale),
    },
  }
}

export default async function LandingPage() {
  const stats = await serverGet<PlatformStats>('/stats', { next: { revalidate: 3600 } })

  const fallbackStats: PlatformStats = {
    stores_count: stats?.stores_count ?? 320,
    products_count: stats?.products_count ?? 12000,
    orders_count: stats?.orders_count ?? 45000,
  }

  return (
    <>
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <Suspense>
        <FeaturedStores />
      </Suspense>
      <StatsBar stats={fallbackStats} />
      <CtaSection />
    </>
  )
}
