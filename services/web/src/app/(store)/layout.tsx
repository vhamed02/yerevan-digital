import Providers from '@/components/providers'
import { GoogleAnalytics } from '@/components/seo/GoogleAnalytics'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <GoogleAnalytics />
      {children}
    </Providers>
  )
}
