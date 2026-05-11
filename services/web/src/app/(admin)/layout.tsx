import Providers from '@/components/providers'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </Providers>
  )
}
