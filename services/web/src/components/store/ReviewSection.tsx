'use client'

import { useState, useEffect, useCallback } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { Star } from 'lucide-react'
import type { ProductReview } from '@/types'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type={onChange ? 'button' : 'button'}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              n <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function CaptchaWidget({ apiUrl, onToken }: { apiUrl: string; onToken: (token: string) => void }) {
  const [img, setImg] = useState('')
  const [rawToken, setRawToken] = useState('')
  const [answer, setAnswer] = useState('')

  const load = useCallback(async () => {
    setAnswer('')
    const res = await fetch(`${apiUrl}/api/v1/captcha`)
    const json = await res.json()
    setImg(json.data.image)
    setRawToken(json.data.token)
    onToken('') // reset parent token on reload
  }, [apiUrl, onToken])

  useEffect(() => { load() }, [load])

  function handleAnswerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setAnswer(val)
    // encode token+answer as JSON so the form can send both
    if (val.trim()) {
      onToken(JSON.stringify({ captcha_token: rawToken, captcha_answer: val.trim() }))
    } else {
      onToken('')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Captcha *
      </label>
      <div className="flex items-center gap-3">
        {img && (
          <img
            src={img}
            alt="captcha"
            className="rounded-lg border border-gray-200 select-none"
            draggable={false}
          />
        )}
        <button
          type="button"
          onClick={load}
          className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
        >
          Refresh
        </button>
      </div>
      <input
        type="text"
        value={answer}
        onChange={handleAnswerChange}
        placeholder="Enter the sum"
        className="w-32 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:bg-white transition-colors"
        maxLength={3}
      />
    </div>
  )
}

interface Props {
  reviews: ProductReview[]
  ratingAvg: number | null
  ratingCount: number
  storeSlug: string
  productSlug: string
}

export default function ReviewSection({
  reviews: initialReviews,
  ratingAvg,
  ratingCount,
  storeSlug,
  productSlug,
}: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
  const [showForm, setShowForm] = useState(false)
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews)
  const [fields, setFields] = useState({ name: '', email: '', body: '' })
  const [rating, setRating] = useState(0)
  const [spamToken, setSpamToken] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:bg-white transition-colors'
  const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) { setErrorMsg('Ընտրեք վարկանիշ'); setStatus('error'); return }
    if (!spamToken) { setErrorMsg('Լրացրեք captcha-ն'); setStatus('error'); return }

    setStatus('sending')
    setErrorMsg('')

    const body: Record<string, unknown> = {
      reviewer_name: fields.name,
      reviewer_email: fields.email || undefined,
      rating,
      body: fields.body || undefined,
    }

    if (SITE_KEY) {
      body.cf_turnstile_response = spamToken
    } else {
      const parsed = JSON.parse(spamToken)
      body.captcha_token = parsed.captcha_token
      body.captcha_answer = parsed.captcha_answer
    }

    try {
      const res = await fetch(`${apiUrl}/api/v1/store/${storeSlug}/products/${productSlug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        const firstError = json.errors ? Object.values(json.errors as Record<string, string[]>)[0]?.[0] : json.message
        throw new Error(firstError || 'Failed to submit')
      }
      setStatus('success')
      setFields({ name: '', email: '', body: '' })
      setRating(0)
      setSpamToken('')
      setShowForm(false)
    } catch (err: unknown) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Ուղարկումը ձախողվեց')
    }
  }

  const displayAvg = ratingCount > 0 ? ratingAvg : null

  return (
    <div className="border-t border-gray-100 pt-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Կարծիքներ</h2>
          {displayAvg ? (
            <div className="mt-1 flex items-center gap-2">
              <Stars value={Math.round(displayAvg)} />
              <span className="text-sm text-gray-600">
                {displayAvg} · {ratingCount} {ratingCount === 1 ? 'կարծիք' : 'կարծիք'}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-400">Դեռ կարծիք չկա</p>
          )}
        </div>
        {!showForm && status !== 'success' && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
          >
            Գրել կարծիք
          </button>
        )}
      </div>

      {status === 'success' && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5">
          <p className="text-sm font-medium text-emerald-800">
            ✓ Շնորհակալություն։ Ձեր կարծիքը կուղարկվի հաստատումից հետո։
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-10 rounded-2xl border border-gray-100 bg-gray-50 p-6 space-y-5">
          <div>
            <label className={labelClass}>Վարկանիշ *</label>
            <Stars value={rating} onChange={setRating} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Անուն *</label>
              <input
                type="text"
                required
                value={fields.name}
                onChange={e => setFields(f => ({ ...f, name: e.target.value }))}
                placeholder="Ձեր անունը"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Էլ. փոստ (կամընտիր)</label>
              <input
                type="email"
                value={fields.email}
                onChange={e => setFields(f => ({ ...f, email: e.target.value }))}
                placeholder="example@mail.com"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Կարծիք (կամընտիր)</label>
            <textarea
              value={fields.body}
              onChange={e => setFields(f => ({ ...f, body: e.target.value }))}
              placeholder="Ձեր կարծիքը ապրանքի մասին..."
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>

          {SITE_KEY ? (
            <Turnstile
              siteKey={SITE_KEY}
              onSuccess={setSpamToken}
              onError={() => setSpamToken('')}
              onExpire={() => setSpamToken('')}
            />
          ) : (
            <CaptchaWidget apiUrl={apiUrl} onToken={setSpamToken} />
          )}

          {status === 'error' && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={status === 'sending'}
              className="rounded-xl bg-gray-900 px-8 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'sending' ? 'Ուղարկվում...' : 'Ուղարկել'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setStatus('idle'); setErrorMsg('') }}
              className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Չեղարկել
            </button>
          </div>
        </form>
      )}

      {reviews.length > 0 && (
        <div className="space-y-5">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{r.reviewer_name}</p>
                  <Stars value={r.rating} />
                </div>
                <time className="shrink-0 text-xs text-gray-400">{r.created_at}</time>
              </div>
              {r.body && (
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{r.body}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
