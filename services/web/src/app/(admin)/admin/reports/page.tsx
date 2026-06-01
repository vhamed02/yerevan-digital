import type { Metadata } from 'next'
import ReportsAnalyticsClient from '@/components/admin/ReportsAnalyticsClient'

export const metadata: Metadata = {
  title: 'Reports & Analytics — Vendora Admin',
}

export default function AdminReportsPage() {
  return <ReportsAnalyticsClient />
}
