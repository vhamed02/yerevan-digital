import type { Metadata } from 'next'
import TrackOrderClient from './TrackOrderClient'

export const metadata: Metadata = {
  title: 'Track your order — Vendorex',
}

export default function TrackPage() {
  return <TrackOrderClient />
}
