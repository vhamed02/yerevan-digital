import Providers from '@/components/providers'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-screen">
        <main className="flex-1 bg-surface-secondary">{children}</main>
      </div>
    </Providers>
  )
}
