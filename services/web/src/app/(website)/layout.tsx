import Providers from '@/components/providers'
import { GoogleAnalytics } from '@/components/seo/GoogleAnalytics'
import Navbar from '@/components/website/Navbar'
import Footer from '@/components/website/Footer'

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <GoogleAnalytics />
      <Navbar />
      {children}
      <Footer />
    </Providers>
  )
}
