'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import Image from 'next/image'
import { useStoreCart } from '@/stores/cart.store'
import api from '@/lib/api'
import type { CheckoutFormProps } from '../types'

const GATEWAY_META: Record<string, { label: string; badge: string; color: string }> = {
  idram:     { label: 'Վճարել iDram-ով',    badge: 'iDram',  color: '#E8001C' },
  inecobank: { label: 'Inecobank փոխանցում', badge: 'Ineco',  color: '#004B87' },
  telcell:   { label: 'Վճարել Telcell-ով',  badge: 'Tcell',  color: '#FF6B00' },
  ameria:    { label: 'Ամերիա Բանկ',        badge: 'Ameria', color: '#003DA5' },
}

const schema = z.object({
  full_name:      z.string().min(2, 'Պարտադիր'),
  email:          z.string().email('Անվավեր էլ. փոստ'),
  phone:          z.string().optional(),
  address:        z.string().min(5, 'Պարտադիր'),
  city:           z.string().min(2, 'Պարտադիր'),
  postal_code:    z.string().optional(),
  country:        z.string().min(2, 'Պարտադիր'),
  notes:          z.string().optional(),
  payment_method: z.string().min(1, 'Ընտրեք վճարման եղանակ'),
})

type CheckoutData = z.infer<typeof schema>

export function CheckoutForm({ storeSlug, store }: CheckoutFormProps) {
  const [mounted, setMounted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const { items: cartItems, getTotal } = useStoreCart(storeSlug)
  // Use empty state during SSR to avoid hydration mismatch with localStorage
  const items = mounted ? cartItems : []
  const total = mounted ? getTotal() : 0

  const gateways = store.payment_gateways ?? []

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutData>({
    resolver: zodResolver(schema),
    defaultValues: {
      country:        'Հայաստան',
      payment_method: gateways[0] ?? '',
    },
  })

  const selectedMethod = watch('payment_method')

  async function onSubmit(data: CheckoutData) {
    setSubmitError(null)
    try {
      const orderRes = await api.post<{ uuid: string }>(
        `/store/${storeSlug}/checkout`,
        {
          ...data,
          items: items.map((i) => ({
            product_id: i.productId,
            variant_id: i.variantId ?? null,
            quantity:   i.quantity,
          })),
        }
      )
      const uuid = orderRes.data.uuid

      const payRes = await api.post<{ redirect_url: string }>(
        `/store/${storeSlug}/payments/initiate`,
        { order_uuid: uuid, payment_method: data.payment_method }
      )

      window.location.href = payRes.data.redirect_url
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const apiMessage = axiosErr.response?.data?.message
      const fieldErrors = axiosErr.response?.data?.errors
      if (fieldErrors) {
        const first = Object.values(fieldErrors).flat()[0]
        setSubmitError(first ?? apiMessage ?? 'Something went wrong. Please try again.')
      } else {
        setSubmitError(apiMessage ?? 'Something went wrong. Please try again.')
      }
    }
  }

  const inputCls =
    'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'
  const errorCls = 'mt-1 text-xs text-red-500'
  const labelCls = 'mb-1.5 block text-sm font-medium text-gray-700'

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Վճարում</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-4 text-base font-semibold text-gray-900">Հաճախորդի տվյալներ</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Անուն Ազգանուն</label>
                <input {...register('full_name')} className={inputCls} placeholder="Աննա Գրիգորյան" />
                {errors.full_name && <p className={errorCls}>{errors.full_name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Էլ. փոստ</label>
                  <input {...register('email')} type="email" className={inputCls} placeholder="anna@example.com" />
                  {errors.email && <p className={errorCls}>{errors.email.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Հեռախոս</label>
                  <input {...register('phone')} type="tel" className={inputCls} placeholder="+374 91 000000" />
                  {errors.phone && <p className={errorCls}>{errors.phone.message}</p>}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-base font-semibold text-gray-900">Առաքման հասցե</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Փողոց, տուն</label>
                <input {...register('address')} className={inputCls} placeholder="Բաղրամյան 1" />
                {errors.address && <p className={errorCls}>{errors.address.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Քաղաք</label>
                  <input {...register('city')} className={inputCls} placeholder="Երևան" />
                  {errors.city && <p className={errorCls}>{errors.city.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Փոստային կոդ</label>
                  <input {...register('postal_code')} className={inputCls} placeholder="0001" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Երկիր</label>
                <input {...register('country')} className={inputCls} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-base font-semibold text-gray-900">Նշումներ</h2>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Հատուկ ցուցումներ առաքման համար..."
            />
          </section>

          <section>
            <h2 className="mb-4 text-base font-semibold text-gray-900">Վճարման եղանակ</h2>
            {gateways.length === 0 ? (
              <p className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                Վճարման եղանակ դեռ հասանելի չէ։
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {gateways.map((key) => {
                  const meta = GATEWAY_META[key] ?? {
                    label: key,
                    badge: key.slice(0, 5),
                    color: '#374151',
                  }
                  const isSelected = selectedMethod === key
                  return (
                    <label
                      key={key}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-colors ${
                        isSelected
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-100 bg-white hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={key}
                        {...register('payment_method')}
                        className="h-4 w-4"
                      />
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-8 w-16 items-center justify-center rounded text-xs font-bold text-white"
                          style={{ backgroundColor: meta.color }}
                        >
                          {meta.badge}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{meta.label}</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
            {errors.payment_method && (
              <p className={errorCls}>{errors.payment_method.message}</p>
            )}
          </section>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Պատվերի ամփոփում</h2>

            {!mounted ? (
              <div className="mb-4 space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-200" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="mb-4 text-sm text-gray-400">Ձեր զամբյուղը դատարկ է։</p>
            ) : (
              <ul className="mb-4 flex flex-col gap-3">
                {items.map((item) => (
                  <li key={`${item.productId}:${item.variantId ?? ''}`} className="flex items-start gap-3">
                    {item.image && (
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-white">
                        <Image src={item.image} alt={item.productName} fill className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-gray-900">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-xs text-gray-500">{item.variantName}</p>
                      )}
                      <p className="text-xs text-gray-500">Քան. {item.quantity}</p>
                    </div>
                    <span className="whitespace-nowrap text-sm font-medium text-gray-900">
                      {(item.price * item.quantity).toLocaleString()} ֏
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Ենթամիջ</span>
                <span>{total.toLocaleString()} ֏</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm text-gray-600">
                <span>Առաքում</span>
                <span className="text-green-600">Անվճար</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-base font-bold text-gray-900">
                <span>Ընդամենը</span>
                <span>{total.toLocaleString()} ֏</span>
              </div>
            </div>

            {submitError && (
              <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !mounted || items.length === 0 || gateways.length === 0}
              className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Մշակվում է...' : 'Պատվիրել և վճարել →'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
