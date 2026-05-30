'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, Lock, ChevronRight, ShoppingBag, Check } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useStoreCart } from '@/stores/cart.store'
import api from '@/lib/api'
import { pickLang } from '@/lib/i18n'
import type { CheckoutFormProps } from '../types'

const GATEWAY_META: Record<string, { label: string; badge: string; color: string }> = {
  idram:     { label: 'iDram',    badge: 'iDRAM',  color: '#E8001C' },
  inecobank: { label: 'Inecobank',badge: 'INECO',  color: '#004B87' },
  telcell:   { label: 'Telcell',  badge: 'TCELL',  color: '#FF6B00' },
  ameria:    { label: 'Ameria',   badge: 'AMERIA', color: '#003DA5' },
}

interface CheckoutData {
  full_name: string
  email: string
  phone?: string
  address: string
  city: string
  postal_code?: string
  country: string
  notes?: string
  payment_method: string
}

function Field({
  label, error, children, hint,
}: {
  label: string
  error?: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}

const inputCls =
  'h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-300 transition-all focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_20%,white)]'

export function CheckoutForm({ storeSlug, store }: CheckoutFormProps) {
  const [mounted, setMounted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2>(1)

  useEffect(() => { setMounted(true) }, [])

  const { items: cartItems, getTotal, clearCart } = useStoreCart(storeSlug)
  const items = mounted ? cartItems : []
  const total = mounted ? getTotal() : 0
  const gateways = store.payment_gateways ?? []

  const t = useTranslations('storefront')
  const locale = useLocale()
  const storeName = pickLang(store.name, locale)

  const schema = useMemo(() => z.object({
    full_name:      z.string().min(2, t('checkout.nameMin')),
    email:          z.string().email(t('checkout.emailInvalid')),
    phone:          z.string().optional(),
    address:        z.string().min(5, t('checkout.required')),
    city:           z.string().min(2, t('checkout.required')),
    postal_code:    z.string().optional(),
    country:        z.string().min(2, t('checkout.required')),
    notes:          z.string().optional(),
    payment_method: z.string().min(1, t('checkout.selectPaymentError')),
  }), [t])

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutData>({
    resolver: zodResolver(schema),
    defaultValues: { country: t('checkout.countryDefault'), payment_method: gateways[0] ?? '' },
  })

  const selectedMethod = watch('payment_method')

  async function goToStep2() {
    const ok = await trigger(['full_name', 'email', 'phone', 'address', 'city', 'country'])
    if (ok) setStep(2)
  }

  async function onSubmit(data: CheckoutData) {
    setSubmitError(null)
    try {
      const orderRes = await api.post<{ uuid: string }>(`/store/${storeSlug}/checkout`, {
        ...data,
        items: items.map((i) => ({ product_id: i.productId, variant_id: i.variantId ?? null, quantity: i.quantity })),
      })
      const uuid = orderRes.data.uuid
      const payRes = await api.post<{ redirect_url: string }>(`/store/${storeSlug}/payments/initiate`, {
        order_uuid: uuid, payment_method: data.payment_method,
      })
      window.location.href = payRes.data.redirect_url
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const fieldErrors = axiosErr.response?.data?.errors
      const apiMessage = axiosErr.response?.data?.message
      const first = fieldErrors ? Object.values(fieldErrors).flat()[0] : undefined
      setSubmitError(first ?? apiMessage ?? t('checkout.genericError'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Top bar */}
      <div className="border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href={`/store/${storeSlug}`} className="font-bold tracking-tight text-gray-900">
            {storeName}
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Lock className="h-3.5 w-3.5" />
            {t('checkout.securePayment')}
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="border-b border-gray-100 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-2 text-sm">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-1.5 font-semibold transition-colors ${step === 1 ? '' : 'text-gray-400 hover:text-gray-700'}`}
            style={step === 1 ? { color: 'var(--accent)' } : {}}
          >
            {step === 2 ? <Check className="h-4 w-4 text-emerald-500" /> : <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black text-white" style={{ backgroundColor: 'var(--accent)' }}>1</span>}
            {t('checkout.step1')}
          </button>
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <span className={`flex items-center gap-1.5 font-semibold ${step === 2 ? '' : 'text-gray-400'}`}
            style={step === 2 ? { color: 'var(--accent)' } : {}}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${step === 2 ? 'text-white' : 'bg-gray-200 text-gray-500'}`}
              style={step === 2 ? { backgroundColor: 'var(--accent)' } : {}}>2</span>
            {t('checkout.step2')}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[1fr_380px]">

          {/* ── Left: form steps ── */}
          <div className="flex flex-col gap-5">

            {step === 1 && (
              <div className="animate-fade-up flex flex-col gap-5">
                {/* Contact */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-5 text-base font-black text-gray-900">{t('checkout.contactDetails')}</h2>
                  <div className="flex flex-col gap-4">
                    <Field label={t('checkout.fullName')} error={errors.full_name?.message}>
                      <input {...register('full_name')} className={inputCls} placeholder={t('checkout.fullNamePlaceholder')} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t('checkout.email')} error={errors.email?.message}>
                        <input {...register('email')} type="email" className={inputCls} placeholder="anna@example.com" />
                      </Field>
                      <Field label={t('checkout.phone')} error={errors.phone?.message} hint={t('checkout.optional')}>
                        <input {...register('phone')} type="tel" className={inputCls} placeholder="+374 91 000000" />
                      </Field>
                    </div>
                  </div>
                </div>

                {/* Shipping */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-5 text-base font-black text-gray-900">{t('checkout.shippingAddress')}</h2>
                  <div className="flex flex-col gap-4">
                    <Field label={t('checkout.streetAddress')} error={errors.address?.message}>
                      <input {...register('address')} className={inputCls} placeholder={t('checkout.streetPlaceholder')} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t('checkout.city')} error={errors.city?.message}>
                        <input {...register('city')} className={inputCls} placeholder={t('checkout.cityPlaceholder')} />
                      </Field>
                      <Field label={t('checkout.postalCode')} error={errors.postal_code?.message} hint={t('checkout.optional')}>
                        <input {...register('postal_code')} className={inputCls} placeholder="0001" />
                      </Field>
                    </div>
                    <Field label={t('checkout.country')} error={errors.country?.message}>
                      <input {...register('country')} className={inputCls} />
                    </Field>
                    <Field label={t('checkout.notes')} error={errors.notes?.message} hint={t('checkout.notesHint')}>
                      <textarea
                        {...register('notes')}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm placeholder:text-gray-300 transition-all focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_20%,white)]"
                        placeholder={t('checkout.notesPlaceholder')}
                      />
                    </Field>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={goToStep2}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all hover:opacity-90 hover:shadow-xl hover:-translate-y-px"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {t('checkout.continueToPayment')}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-up flex flex-col gap-5">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-5 text-base font-black text-gray-900">{t('checkout.selectPaymentMethod')}</h2>
                  {gateways.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-5">
                      <ShieldCheck className="h-5 w-5 text-gray-300" />
                      <p className="text-sm text-gray-500">{t('checkout.noPaymentMethods')}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {gateways.map((key) => {
                        const meta = GATEWAY_META[key] ?? { label: key, badge: key.slice(0, 5).toUpperCase(), color: '#374151' }
                        const isSelected = selectedMethod === key
                        return (
                          <label
                            key={key}
                            className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all ${
                              isSelected
                                ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_5%,white)] shadow-sm'
                                : 'border-gray-100 bg-white hover:border-gray-200'
                            }`}
                          >
                            <input type="radio" value={key} {...register('payment_method')} className="sr-only" />
                            <div
                              className="flex h-10 w-16 flex-shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-sm"
                              style={{ backgroundColor: meta.color }}
                            >
                              {meta.badge}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900">{meta.label}</p>
                            </div>
                            <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${isSelected ? 'border-[var(--accent)]' : 'border-gray-200'}`}>
                              {isSelected && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                  {errors.payment_method && (
                    <p className="mt-2 text-xs font-medium text-red-500">{errors.payment_method.message}</p>
                  )}
                </div>

                {submitError && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !mounted || items.length === 0 || gateways.length === 0}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-black text-white shadow-lg shadow-black/10 transition-all hover:opacity-90 hover:shadow-xl hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Lock className="h-4 w-4" />
                  {isSubmitting ? t('checkout.processing') : t('checkout.pay', { total: `${total.toLocaleString()} ֏` })}
                </button>

                <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> {t('checkout.sslSecure')}</span>
                  <span className="text-gray-200">|</span>
                  <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> {t('checkout.dataProtected')}</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: order summary ── */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-gray-500" />
                  <h2 className="text-sm font-black text-gray-900">{t('checkout.orderSummary')}</h2>
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: 'var(--accent)' }}>
                    {items.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                </div>
              </div>

              <div className="px-5 py-4">
                {!mounted ? (
                  <div className="flex flex-col gap-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-3">
                        <div className="h-14 w-14 animate-pulse rounded-xl bg-gray-100" />
                        <div className="flex flex-1 flex-col gap-2">
                          <div className="h-3 animate-pulse rounded bg-gray-100" />
                          <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <p className="text-sm text-gray-400">{t('cart.empty')}</p>
                ) : (
                  <ul className="flex flex-col gap-4">
                    {items.map((item) => (
                      <li key={`${item.productId}:${item.variantId ?? ''}`} className="flex items-start gap-3">
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50 ring-1 ring-black/[0.04]">
                          {item.image ? (
                            <Image src={item.image} alt={item.productName} fill className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ShoppingBag className="h-5 w-5 text-gray-200" />
                            </div>
                          )}
                          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-[9px] font-bold text-white">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-snug text-gray-900 line-clamp-2">{item.productName}</p>
                          {item.variantName && <p className="text-xs text-gray-400">{item.variantName}</p>}
                        </div>
                        <span className="whitespace-nowrap text-sm font-bold text-gray-900">
                          {(item.price * item.quantity).toLocaleString()} ֏
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-gray-100 px-5 py-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{t('checkout.subtotal')}</span>
                    <span>{total.toLocaleString()} ֏</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{t('checkout.shipping')}</span>
                    <span className="font-semibold text-emerald-600">{t('checkout.free')}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3 text-base">
                    <span className="font-black text-gray-900">{t('checkout.total')}</span>
                    <span className="text-xl font-black text-gray-900">{total.toLocaleString()} ֏</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
