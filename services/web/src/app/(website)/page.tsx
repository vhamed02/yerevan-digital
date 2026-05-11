import type { Metadata } from 'next'
import { Suspense } from 'react'
import HeroSection from '@/components/website/HeroSection'
import HowItWorks from '@/components/website/HowItWorks'
import FeaturesSection from '@/components/website/FeaturesSection'
import FeaturedStores from '@/components/website/FeaturedStores'
import StatsBar from '@/components/website/StatsBar'
import CtaSection from '@/components/website/CtaSection'
import { serverGet } from '@/lib/server-api'
import type { PlatformStats } from '@/types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Vendora — Armenian Online Store Builder',
  description:
    'Create your Armenian online store in minutes. Accept Idram payments, manage products, and grow your business.',
  openGraph: {
    title: 'Vendora — Armenian Online Store Builder',
    description:
      'Create your Armenian online store in minutes. Accept Idram payments, manage products, and grow your business.',
    type: 'website',
    locale: 'hy_AM',
    siteName: 'Vendora',
  },
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
