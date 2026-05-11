import Providers from '@/components/providers'
import Navbar from '@/components/website/Navbar'
import Footer from '@/components/website/Footer'

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Navbar />
      {children}
      <Footer />
    </Providers>
  )
}
