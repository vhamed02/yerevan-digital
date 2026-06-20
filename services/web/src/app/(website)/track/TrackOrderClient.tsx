'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import OrderStatusView from '@/components/account/OrderStatusView'
import api from '@/lib/api'
import type { AccountOrder } from '@/types'

export default function TrackOrderClient() {
  const t = useTranslations('account')
  const [order, setOrder] = useState<AccountOrder | null>(null)
  const [notFound, setNotFound] = useState(false)

  const schema = z.object({
    order_number: z.string().min(1, t('track.orderNumberRequired')),
    email: z.string().email(t('track.emailInvalid')),
  })
  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setNotFound(false)
    setOrder(null)
    try {
      const res = await api.post<AccountOrder>('/orders/track', data)
      setOrder(res.data)
    } catch {
      setNotFound(true)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-2xl font-bold text-content-primary sm:text-3xl">{t('track.title')}</h1>
        <p className="mt-2 text-sm text-content-secondary">{t('track.subtitle')}</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6"
        noValidate
      >
        <Input
          label={t('track.orderNumber')}
          placeholder="VEND-2026-00042"
          error={errors.order_number?.message}
          {...register('order_number')}
        />
        <Input
          label={t('track.email')}
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          <Search className="mr-2 h-4 w-4" />
          {t('track.submit')}
        </Button>
      </form>

      {notFound && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm font-medium text-red-700">
          {t('track.notFound')}
        </div>
      )}

      {order && <OrderStatusView order={order} />}
    </main>
  )
}
