'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import Image from 'next/image'
import { useStoreCart } from '@/stores/cart.store'
import api from '@/lib/api'
import type { CheckoutFormProps } from '../types'

const schema = z.object({
  full_name: z.string().min(2, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(8, 'Invalid phone'),
  address: z.string().min(5, 'Required'),
  city: z.string().min(2, 'Required'),
  postal_code: z.string().optional(),
  country: z.string().min(2, 'Required'),
  notes: z.string().optional(),
  payment_method: z.enum(['idram']),
})

type CheckoutData = z.infer<typeof schema>

export function CheckoutForm({ storeSlug }: CheckoutFormProps) {
  const { items, getTotal, clearCart } = useStoreCart(storeSlug)
  const total = getTotal()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutData>({
    resolver: zodResolver(schema),
    defaultValues: {
      country: 'Armenia',
      payment_method: 'idram',
    },
  })

  async function onSubmit(data: CheckoutData) {
    const orderRes = await api.post<{ data: { uuid: string } }>(
      `/store/${storeSlug}/checkout`,
      {
        ...data,
        items: items.map((i) => ({
          product_id: i.productId,
          variant_id: i.variantId ?? null,
          quantity: i.quantity,
          price: i.price,
        })),
      }
    )
    const uuid = orderRes.data.data.uuid

    const payRes = await api.post<{ data: { redirect_url: string } }>(
      `/store/${storeSlug}/payments/initiate`,
      { order_uuid: uuid, payment_method: data.payment_method }
    )

    clearCart()
    window.location.href = payRes.data.data.redirect_url
  }

  const inputCls =
    'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'
  const errorCls = 'mt-1 text-xs text-red-500'
  const labelCls = 'mb-1.5 block text-sm font-medium text-gray-700'

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-4 text-base font-semibold text-gray-900">Customer Info</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <input {...register('full_name')} className={inputCls} placeholder="Anna Grigoryan" />
                {errors.full_name && <p className={errorCls}>{errors.full_name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Email</label>
                  <input {...register('email')} type="email" className={inputCls} placeholder="anna@example.com" />
                  {errors.email && <p className={errorCls}>{errors.email.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input {...register('phone')} type="tel" className={inputCls} placeholder="+374 91 000000" />
                  {errors.phone && <p className={errorCls}>{errors.phone.message}</p>}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-base font-semibold text-gray-900">Delivery Address</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Street Address</label>
                <input {...register('address')} className={inputCls} placeholder="Baghramyan Ave 1" />
                {errors.address && <p className={errorCls}>{errors.address.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>City</label>
                  <input {...register('city')} className={inputCls} placeholder="Yerevan" />
                  {errors.city && <p className={errorCls}>{errors.city.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Postal Code</label>
                  <input {...register('postal_code')} className={inputCls} placeholder="0001" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input {...register('country')} className={inputCls} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-base font-semibold text-gray-900">Order Notes</h2>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Special delivery instructions..."
            />
          </section>

          <section>
            <h2 className="mb-4 text-base font-semibold text-gray-900">Payment Method</h2>
            <div className="flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-gray-900 bg-gray-50 p-4">
                <input
                  type="radio"
                  value="idram"
                  {...register('payment_method')}
                  className="h-4 w-4"
                />
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-16 items-center justify-center rounded bg-[#E8001C] text-xs font-bold text-white">
                    iDram
                  </div>
                  <span className="text-sm font-medium text-gray-900">Pay with Idram</span>
                </div>
              </label>
              <label className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-gray-100 p-4 opacity-50">
                <input type="radio" disabled className="h-4 w-4" />
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-16 items-center justify-center rounded bg-gray-200 text-xs font-medium text-gray-500">
                    Inecobank
                  </div>
                  <span className="text-sm text-gray-500">Coming Soon</span>
                </div>
              </label>
            </div>
          </section>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Order Summary</h2>
            <ul className="mb-4 flex flex-col gap-3">
              {items.map((item) => (
                <li key={`${item.productId}:${item.variantId ?? ''}`} className="flex items-start gap-3">
                  {item.image && (
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white border border-gray-100">
                      <Image src={item.image} alt={item.productName} fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.productName}</p>
                    {item.variantName && (
                      <p className="text-xs text-gray-500">{item.variantName}</p>
                    )}
                    <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                    {(item.price * item.quantity).toLocaleString()} ֏
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{total.toLocaleString()} ֏</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-base font-bold text-gray-900">
                <span>Total</span>
                <span>{total.toLocaleString()} ֏</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="mt-5 w-full rounded-xl bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Processing…' : 'Place Order & Pay →'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
