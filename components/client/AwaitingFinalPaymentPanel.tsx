'use client'

import { useState } from 'react'
import { CreditCard, Loader2, ShieldCheck, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Props {
  orderId:           string
  finalAmount:       number
  quantity?:         number
  unitPriceCents?:   number
  extraLogoCents?:   number
  onSuccess:         () => void
}

function money(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default function AwaitingFinalPaymentPanel({ orderId, finalAmount, quantity, unitPriceCents = 0, extraLogoCents = 0 }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const perPiece   = unitPriceCents + extraLogoCents
  const qty        = quantity ?? 1
  const subtotal   = perPiece * qty
  const deposit    = Math.round(subtotal / 2)
  // Use passed finalAmount if subtotal is unavailable (0), otherwise compute it
  const remaining  = subtotal > 0 ? subtotal - deposit : finalAmount

  async function handlePay() {
    setLoading(true)
    setError('')
    try {
      const sb = createClient()
      const token = sb ? (await sb.auth.getSession()).data.session?.access_token : null
      const res = await fetch('/api/checkout/final-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ order_id: orderId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment setup failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="card border-amber-200/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
          <Package size={11} className="text-white" />
        </div>
        <p className="text-xs font-semibold text-gray-900">Final Payment Required</p>
        <span className="ml-auto text-[10px] font-medium px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
          Action Required
        </span>
      </div>

      <p className="text-[11px] text-gray-600 leading-relaxed mb-4">
        Your order has passed quality check and is ready for shipment. Pay the remaining balance to authorize your supplier to ship.
      </p>

      <div className="border border-slate-100 rounded-xl p-3 mb-4 space-y-1.5">
        {perPiece > 0 && (
          <div className="flex justify-between items-center text-[11px] text-gray-400">
            <span>Price per piece</span>
            <span>{money(perPiece)}</span>
          </div>
        )}
        {perPiece > 0 && qty > 0 && (
          <div className="flex justify-between items-center text-[11px] text-gray-400">
            <span>{qty} pc{qty > 1 ? 's' : ''} × {money(perPiece)}</span>
            <span>{money(subtotal)}</span>
          </div>
        )}
        {deposit > 0 && (
          <div className="flex justify-between items-center text-[11px] text-gray-400">
            <span>Deposit already paid (50%)</span>
            <span>− {money(deposit)}</span>
          </div>
        )}
        <div className="flex justify-between items-center border-t border-slate-100 pt-1.5">
          <span className="text-xs text-gray-600 font-medium">Remaining Balance (50%)</span>
          <span className="text-sm font-semibold text-gray-900">{money(remaining)}</span>
        </div>
        <p className="text-[10px] text-gray-400">Shipment authorised immediately upon payment</p>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      <button
        onClick={handlePay}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
      >
        {loading ? <Loader2 size={13} className="animate-spin"/> : <CreditCard size={13}/>}
        {loading ? 'Redirecting…' : `Complete Payment & Authorize Shipment`}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 mt-2">
        <ShieldCheck size={11}/>
        Secure checkout via Stripe
      </div>
    </div>
  )
}
