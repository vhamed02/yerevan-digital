import Providers from '@/components/providers'

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}
