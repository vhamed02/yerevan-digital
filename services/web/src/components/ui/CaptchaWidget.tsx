'use client'

import { useCallback, useEffect, useState } from 'react'

interface CaptchaWidgetProps {
  apiUrl: string
  onToken: (token: string) => void
  label: string
  refreshLabel: string
  placeholder: string
}

/**
 * Dynamic, numeric, image-based captcha. Fetches a fresh "a + b = ?" PNG from
 * GET /api/v1/captcha, and emits a JSON-encoded {captcha_token, captcha_answer}
 * to the parent (or '' while unanswered). Reused by the comment form and ready
 * for any other public form. Backed by the server-side CaptchaController.
 */
export function CaptchaWidget({ apiUrl, onToken, label, refreshLabel, placeholder }: CaptchaWidgetProps) {
  const [img, setImg] = useState('')
  const [rawToken, setRawToken] = useState('')
  const [answer, setAnswer] = useState('')

  const load = useCallback(async () => {
    setAnswer('')
    onToken('')
    try {
      const res = await fetch(`${apiUrl}/api/v1/captcha`)
      const json = await res.json()
      setImg(json.image)
      setRawToken(json.token)
    } catch {
      setImg('')
    }
  }, [apiUrl, onToken])

  useEffect(() => {
    load()
  }, [load])

  function handleAnswer(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setAnswer(val)
    onToken(val.trim() ? JSON.stringify({ captcha_token: rawToken, captcha_answer: val.trim() }) : '')
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-content-muted">{label} *</label>
      <div className="flex items-center gap-3">
        {img && (
          <img src={img} alt="captcha" className="select-none rounded-lg border border-border" draggable={false} />
        )}
        <button
          type="button"
          onClick={load}
          className="text-xs text-content-muted underline underline-offset-2 hover:text-content-secondary"
        >
          {refreshLabel}
        </button>
      </div>
      <input
        type="text"
        inputMode="numeric"
        value={answer}
        onChange={handleAnswer}
        placeholder={placeholder}
        maxLength={3}
        className="w-32 rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm text-content-primary outline-none transition-colors focus:border-brand-500 focus:bg-white"
      />
    </div>
  )
}
