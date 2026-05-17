'use client'

import { useState } from 'react'

interface Props {
  orderId: string
  amount: string
  currency: string
  apiUrl: string
}

export function SandboxPayClient({ orderId, amount, currency, apiUrl }: Props) {
  const [loading, setLoading] = useState<'success' | 'fail' | null>(null)
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'fail'; text: string } | null>(null)

  async function complete(outcome: 'success' | 'fail') {
    setLoading(outcome)
    setResultMsg(null)
    try {
      const res = await fetch(`${apiUrl}/api/v1/store/payments/sandbox/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ order_id: orderId, outcome }),
      })
      const json = await res.json()
      if (json.success && json.data?.redirect) {
        setResultMsg({
          type: outcome,
          text: outcome === 'success' ? '✓ Payment confirmed — redirecting…' : '✕ Payment declined — redirecting…',
        })
        setTimeout(() => { window.location.href = json.data.redirect }, 1400)
      } else {
        throw new Error(json.message ?? 'Unexpected error')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setResultMsg({ type: 'fail', text: '✕ ' + msg })
      setLoading(null)
    }
  }

  const busy = loading !== null

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#0f0f13] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px]">

        {/* Sandbox banner */}
        <div className="flex items-center gap-2 bg-[#1a1a00] border border-[#3d3a00] rounded-xl px-4 py-2.5 mb-5">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
          <span className="text-[11px] font-semibold text-yellow-400 uppercase tracking-wider">
            Sandbox Mode — no real payment
          </span>
        </div>

        {/* Card visual */}
        <div
          className="relative rounded-2xl p-6 mb-5 overflow-hidden min-h-[170px] border border-white/8"
          style={{ background: 'linear-gradient(135deg, #1c1c2e 0%, #2d1b69 55%, #1a1a3e 100%)' }}
        >
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-purple-500/10 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-blue-500/10 pointer-events-none" />
          {/* Chip */}
          <div
            className="w-9 h-7 rounded mb-5 relative z-10"
            style={{ background: 'linear-gradient(135deg, #d4a843, #f5d78e)' }}
          />
          <p className="font-mono text-lg text-white/90 tracking-widest mb-5 relative z-10">
            4242&nbsp;&nbsp;4242&nbsp;&nbsp;4242&nbsp;&nbsp;4242
          </p>
          <div className="flex justify-between items-end relative z-10">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Cardholder</p>
              <p className="text-sm text-white/80 font-medium">TEST USER</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Expires</p>
              <p className="text-sm text-white/80 font-medium">12/30</p>
            </div>
            <p className="text-xl font-extrabold italic text-white/60">VISA</p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-6">
          <p className="text-white font-semibold text-[15px] mb-0.5">Card Details</p>
          <p className="text-white/40 text-[13px] mb-5">Pre-filled with test data — nothing is charged</p>

          {/* Mock fields */}
          <div className="space-y-3 mb-5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-white/40 mb-1.5">
                Card Number
              </label>
              <input
                readOnly
                value="4242 4242 4242 4242"
                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3.5 text-[14px] text-white/60 font-mono tracking-widest outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-white/40 mb-1.5">
                  Expiry
                </label>
                <input
                  readOnly
                  value="12 / 30"
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3.5 text-[14px] text-white/60 font-mono tracking-widest outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-white/40 mb-1.5">
                  CVV
                </label>
                <input
                  readOnly
                  value="123"
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3.5 text-[14px] text-white/60 font-mono tracking-widest outline-none"
                />
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-white/3 border border-white/6 rounded-xl px-4 py-3 mb-5 space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-white/40">Order</span>
              <span className="text-white/50 font-mono text-[12px]">
                {orderId ? orderId.slice(0, 8).toUpperCase() + '…' : '—'}
              </span>
            </div>
            <div className="flex justify-between text-[13px] pt-2 border-t border-white/6">
              <span className="text-white/40">Total</span>
              <span className="text-white font-bold text-[15px]">{amount} {currency}</span>
            </div>
          </div>

          {/* Result message */}
          {resultMsg && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-medium mb-4 ${
              resultMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-300'
                : 'bg-red-500/10 border border-red-500/20 text-red-300'
            }`}>
              {resultMsg.text}
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={() => complete('success')}
              disabled={busy}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
              style={{ boxShadow: '0 4px 16px rgba(16,185,129,0.25)' }}
            >
              {loading === 'success' ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : '✓'}
              &nbsp;Pay Successfully
            </button>
            <button
              onClick={() => complete('fail')}
              disabled={busy}
              className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 transition-colors flex items-center justify-center gap-2"
            >
              {loading === 'fail' ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : '✕'}
              &nbsp;Simulate Failure
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
