'use client'

import { useState } from 'react'
import { CreditCard, Loader2, ShieldCheck, Package } from 'lucide-react'
import SizeBreakdownPicker from '@/components/SizeBreakdownPicker'
import {
  MIN_PRODUCTION_QUANTITY,
  bulkSubtotalCents,
  depositCents,
} from '@/lib/pricing'
import { emptyBreakdown, sumBreakdown, type SizeBreakdown } from '@/lib/sizes'

interface Props {
  orderId:           string
  unitPriceCents:    number
  extraLogoFeeCents: number
  initialQuantity:   number
  onSuccess:         () => void
}

function money(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default function DepositPaymentPanel({
  orderId,
  unitPriceCents,
  extraLogoFeeCents,
}: Props) {
  const [breakdown, setBreakdown] = useState<SizeBreakdown>(emptyBreakdown)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const quantity = sumBreakdown(breakdown)
  const subtotal = bulkSubtotalCents(unitPriceCents, extraLogoFeeCents, Math.max(1, quantity))
  const deposit  = depositCents(subtotal)
  const perPiece = unitPriceCents + extraLogoFeeCents
  const belowMOQ = quantity < MIN_PRODUCTION_QUANTITY

  async function handlePay() {
    if (belowMOQ) {
      setError(`Minimum order is ${MIN_PRODUCTION_QUANTITY} pieces. Please add more sizes.`)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout/production-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, size_breakdown: breakdown, quantity }),
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
        <p className="text-xs font-semibold text-gray-900">Production Deposit Required</p>
        <span className="ml-auto text-[10px] font-medium px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
          Action Required
        </span>
      </div>

      <p className="text-[11px] text-gray-600 leading-relaxed mb-4">
        Your sample is approved. Choose your size run, then pay the 50% deposit to authorize the factory to begin bulk production.
      </p>

      {/* Per-piece price context */}
      <p className="text-[10px] text-gray-400 mb-2">{money(perPiece)} per piece · minimum {MIN_PRODUCTION_QUANTITY} pieces</p>

      {/* Size picker */}
      <div className="mb-4">
        <SizeBreakdownPicker
          value={breakdown}
          onChange={setBreakdown}
          minTotal={MIN_PRODUCTION_QUANTITY}
          disabled={loading}
        />
      </div>

      {/* Cost breakdown */}
      {quantity > 0 && (
        <div className="border border-slate-100 rounded-xl p-3 mb-4 space-y-1.5">
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span>Subtotal ({quantity} pc{quantity > 1 ? 's' : ''})</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-100 pt-1.5">
            <span className="text-xs font-semibold text-gray-900">Deposit Due Today (50%)</span>
            <span className="text-sm font-semibold text-gray-900">{money(deposit)}</span>
          </div>
          <p className="text-[10px] text-gray-400">
            Remaining {money(subtotal - deposit)} due after quality check, before shipment
          </p>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      <button
        onClick={handlePay}
        disabled={loading || belowMOQ}
        className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-50"
      >
        {loading ? <Loader2 size={13} className="animate-spin"/> : <CreditCard size={13}/>}
        {loading
          ? 'Redirecting…'
          : belowMOQ
            ? `Add ${MIN_PRODUCTION_QUANTITY - quantity} more pieces`
            : `Pay ${money(deposit)} Deposit & Start Production`}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 mt-2">
        <ShieldCheck size={11}/>
        Secure checkout via Stripe
      </div>
    </div>
  )
}
