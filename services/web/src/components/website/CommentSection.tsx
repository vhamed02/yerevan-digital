'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Turnstile } from '@marsidev/react-turnstile'
import { CaptchaWidget } from '@/components/ui/CaptchaWidget'
import { formatPostDate } from '@/lib/blog'
import type { PublicComment } from '@/types'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

export function CommentSection({ slug }: { slug: string }) {
  const t = useTranslations('comments')
  const locale = useLocale()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''

  const [comments, setComments] = useState<PublicComment[]>([])
  const [fields, setFields] = useState({ name: '', email: '', body: '' })
  const [spamToken, setSpamToken] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/posts/${slug}/comments`, { headers: { Accept: 'application/json' } })
      const json = await res.json()
      setComments(Array.isArray(json.data) ? json.data : [])
    } catch {
      setComments([])
    }
  }, [apiUrl, slug])

  useEffect(() => {
    load()
  }, [load])

  const inputClass =
    'w-full rounded-xl border border-border bg-surface-secondary px-4 py-3 text-sm text-content-primary outline-none transition-colors focus:border-brand-500 focus:bg-white'
  const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-content-muted'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fields.name.trim() || !fields.body.trim()) {
      setErrorMsg(t('fillRequired'))
      setStatus('error')
      return
    }
    if (!spamToken) {
      setErrorMsg(t('fillCaptcha'))
      setStatus('error')
      return
    }

    setStatus('sending')
    setErrorMsg('')

    const body: Record<string, unknown> = {
      author_name: fields.name,
      author_email: fields.email || undefined,
      body: fields.body,
    }
    if (SITE_KEY) {
      body.cf_turnstile_response = spamToken
    } else {
      try {
        const parsed = JSON.parse(spamToken)
        body.captcha_token = parsed.captcha_token
        body.captcha_answer = parsed.captcha_answer
      } catch {
        /* malformed token — server will reject */
      }
    }

    try {
      const res = await fetch(`${apiUrl}/api/v1/posts/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        const firstError = json.errors
          ? Object.values(json.errors as Record<string, string[]>)[0]?.[0]
          : json.message
        throw new Error(firstError || t('submitFailed'))
      }
      setStatus('success')
      setFields({ name: '', email: '', body: '' })
      setSpamToken('')
    } catch (err: unknown) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : t('submitFailed'))
    }
  }

  return (
    <section className="mt-12 border-t border-border pt-10">
      <h2 className="font-heading text-2xl font-bold text-content-primary">
        {t('heading')}
        {comments.length > 0 ? ` (${comments.length})` : ''}
      </h2>

      {comments.length > 0 ? (
        <div className="mt-6 space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-content-primary">{c.author_name}</p>
                <time className="shrink-0 text-xs text-content-muted">{formatPostDate(c.created_at, locale)}</time>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-content-secondary">{c.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-content-muted">{t('empty')}</p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-border bg-surface-secondary p-6">
        <h3 className="font-heading text-lg font-bold text-content-primary">{t('formHeading')}</h3>

        {status === 'success' && (
          <p className="rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm font-medium text-status-success">
            ✓ {t('successPending')}
          </p>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t('name')} *</label>
            <input
              type="text"
              required
              maxLength={100}
              value={fields.name}
              onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
              placeholder={t('namePlaceholder')}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t('emailOptional')}</label>
            <input
              type="email"
              maxLength={200}
              value={fields.email}
              onChange={(e) => setFields((f) => ({ ...f, email: e.target.value }))}
              placeholder="example@mail.com"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>{t('message')} *</label>
          <textarea
            required
            rows={4}
            maxLength={2000}
            value={fields.body}
            onChange={(e) => setFields((f) => ({ ...f, body: e.target.value }))}
            placeholder={t('messagePlaceholder')}
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
          <CaptchaWidget
            apiUrl={apiUrl}
            onToken={setSpamToken}
            label={t('captcha')}
            refreshLabel={t('refresh')}
            placeholder={t('enterSum')}
          />
        )}

        {status === 'error' && (
          <p className="rounded-xl border border-status-error/30 bg-status-error/10 px-4 py-3 text-sm text-status-error">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'sending'}
          className="rounded-xl bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'sending' ? t('submitting') : t('submit')}
        </button>
      </form>
    </section>
  )
}
