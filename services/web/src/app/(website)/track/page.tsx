import type { Metadata } from 'next'
import TrackOrderClient from './TrackOrderClient'

export const metadata: Metadata = {
  title: 'Track your order — Yerevan Digital',
}

export default function TrackPage() {
  return <TrackOrderClient />
}
