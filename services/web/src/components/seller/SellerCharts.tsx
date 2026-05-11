'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import type { SellerRevenueChartPoint, AdminOrderStatusPoint } from '@/types'

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#64748b']

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

interface RevenueBarChartProps {
  data: SellerRevenueChartPoint[]
}

export function RevenueBarChart({ data }: RevenueBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => {
            const d = new Date(v)
            return `${d.getMonth() + 1}/${d.getDate()}`
          }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          labelFormatter={(v) => new Date(v).toLocaleDateString()}
          formatter={(v) => [`${Number(v).toLocaleString()} ֏`, 'Revenue']}
        />
        <Bar dataKey="revenue" fill="#6366f1" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface OrderStatusDonutProps {
  data: AdminOrderStatusPoint[]
}

export function OrderStatusDonut({ data }: OrderStatusDonutProps) {
  const labeled = data.map((d) => ({ ...d, label: STATUS_LABELS[d.status] ?? d.status }))
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={labeled}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={50}
        >
          {labeled.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
