'use client'

import { useState } from 'react'

const t = {
  hy: {
    name: 'Անուն',
    namePlaceholder: 'Ձեր անունը',
    email: 'Էլ. փոստ (կամընտիր)',
    emailPlaceholder: 'example@mail.com',
    phone: 'Հեռախոս',
    phonePlaceholder: '+374 XX XXX XXX',
    message: 'Հաղորդագրություն',
    messagePlaceholder: 'Ձեր հարցը կամ հաղորդագրությունը...',
    send: 'Ուղարկել',
    sending: 'Ուղարկվում է...',
    success: 'Ձեր հաղորդագրությունն ուղարկված է։ Մենք կպատասխանենք 24 ժամվա ընթացքում։',
    errorRequired: 'Լրացրեք պահանջվող դաշտերը',
    errorGeneric: 'Ուղարկումը ձախողվեց։ Խնդրում ենք կրկնել փորձը։',
  },
  en: {
    name: 'Name',
    namePlaceholder: 'Your name',
    email: 'Email (optional)',
    emailPlaceholder: 'example@mail.com',
    phone: 'Phone',
    phonePlaceholder: '+374 XX XXX XXX',
    message: 'Message',
    messagePlaceholder: 'Your question or message...',
    send: 'Send Message',
    sending: 'Sending...',
    success: 'Your message has been sent. We will reply within 24 hours.',
    errorRequired: 'Please fill in the required fields',
    errorGeneric: 'Failed to send. Please try again.',
  },
}

interface Props {
  locale: string
  apiUrl: string
}

export default function ContactForm({ locale, apiUrl }: Props) {
  const lang = locale === 'en' ? t.en : t.hy

  const [fields, setFields] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fields.name.trim() || !fields.message.trim()) {
      setStatus('error')
      setErrorMsg(lang.errorRequired)
      return
    }
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch(`${apiUrl}/api/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: fields.name,
          email: fields.email || undefined,
          phone: fields.phone || undefined,
          message: fields.message,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || lang.errorGeneric)
      setStatus('success')
      setFields({ name: '', email: '', phone: '', message: '' })
    } catch (err: unknown) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : lang.errorGeneric)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:bg-white transition-colors'
  const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5'

  if (status === 'success') {
    return (
      <div className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
        <div className="mb-3 text-3xl">✓</div>
        <p className="text-sm font-medium text-emerald-800">{lang.success}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-12 space-y-5">
      <div>
        <label className={labelClass}>{lang.name} *</label>
        <input
          type="text"
          value={fields.name}
          onChange={set('name')}
          placeholder={lang.namePlaceholder}
          className={inputClass}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{lang.email}</label>
          <input
            type="email"
            value={fields.email}
            onChange={set('email')}
            placeholder={lang.emailPlaceholder}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{lang.phone}</label>
          <input
            type="tel"
            value={fields.phone}
            onChange={set('phone')}
            placeholder={lang.phonePlaceholder}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>{lang.message} *</label>
        <textarea
          value={fields.message}
          onChange={set('message')}
          placeholder={lang.messagePlaceholder}
          rows={5}
          className={`${inputClass} resize-none`}
          required
        />
      </div>

      {status === 'error' && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="h-12 w-full rounded-xl bg-gray-900 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:px-10"
      >
        {status === 'sending' ? lang.sending : lang.send}
      </button>
    </form>
  )
}
