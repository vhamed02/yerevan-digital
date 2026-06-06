import type { Metadata } from 'next'
import ReportsAnalyticsClient from '@/components/admin/ReportsAnalyticsClient'

export const metadata: Metadata = {
  title: 'Reports & Analytics — Vendorex Admin',
}

export default function AdminReportsPage() {
  return <ReportsAnalyticsClient />
}
