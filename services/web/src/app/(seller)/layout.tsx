import Providers from '@/components/providers'

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen bg-surface-secondary">
        <main>{children}</main>
      </div>
    </Providers>
  )
}
