'use client'

import { useState } from 'react'
import { X, Sparkles, Check, Package, Infinity as InfinityIcon } from 'lucide-react'
import { useAICredits } from '@/lib/aiCreditsContext'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import type { Tier } from '@/lib/tiers'

interface Props {
  /** Called when the user selects "Start Sample / Production" path. */
  onStartProduction?: () => void
}

export default function AIPaywallModal({ onStartProduction }: Props) {
  const { isPaywallOpen, closePaywall } = useAICredits()
  const { user } = useAuth()
  const [subscribing, setSubscribing] = useState<Tier | null>(null)
  const [error, setError] = useState('')

  if (!isPaywallOpen) return null

  const handleSubscribe = async (tier: Tier) => {
    setError('')
    if (!user) { setError('Please sign in to subscribe.'); return }
    setSubscribing(tier)
    try {
      const sb = createClient()
      const token = sb ? (await sb.auth.getSession()).data.session?.access_token : null
      const res = await fetch('/api/checkout/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ tier }),
      })
      const json = await res.json()
      if (!res.ok || json.error) { setError(json.error ?? 'Checkout failed.'); return }
      window.location.href = json.url
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubscribing(null)
    }
  }

  const handleStartProduction = () => {
    closePaywall()
    onStartProduction?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closePaywall} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[680px] overflow-hidden">
        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-grace-border">
          <button onClick={closePaywall} className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-grace-mist flex items-center justify-center text-grace-stone transition-colors">
            <X size={15} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-grace-ink flex items-center justify-center mb-3">
            <Sparkles size={18} className="text-white" />
          </div>
          <h2 className="text-xl font-black text-grace-ink tracking-tight">You&apos;ve used your 3 free AI generations</h2>
          <p className="text-[13px] text-grace-stone mt-1 leading-relaxed">
            Subscribe for unlimited AI, or take your concept straight into production.
          </p>
        </div>

        {/* Body — two panels */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-0">
          {/* Option 1: Subscribe */}
          <div className="p-7">
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-grace-stone mb-1">Keep Designing</p>
            <p className="text-[13px] text-grace-stone leading-relaxed mb-5">
              Go unlimited with a membership. Cancel anytime.
            </p>

            <div className="p-4 rounded-xl border border-grace-ink bg-grace-ink text-white mb-3">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-black">Designer</span>
                <span className="text-sm font-black">$19<span className="text-[11px] font-semibold text-white/60">/mo</span></span>
              </div>
              {['Unlimited AI generations', 'Full studio + tech pack exports', '1 saved size profile'].map(f => (
                <div key={f} className="flex items-start gap-2 mb-1">
                  <Check size={11} className="text-white mt-0.5 shrink-0" />
                  <span className="text-[12px] text-white/85">{f}</span>
                </div>
              ))}
              <button onClick={() => handleSubscribe('designer')} disabled={!!subscribing}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-grace-ink text-sm font-bold hover:bg-grace-mist transition-colors disabled:opacity-60">
                {subscribing === 'designer'
                  ? <div className="w-4 h-4 border-2 border-grace-ink/40 border-t-grace-ink rounded-full animate-spin" />
                  : <><InfinityIcon size={14} /> Go unlimited — $19/mo</>}
              </button>
            </div>

            <button onClick={() => handleSubscribe('brand')} disabled={!!subscribing}
              className="w-full text-left px-4 py-2.5 rounded-xl border border-grace-border hover:border-grace-ink hover:bg-grace-mist transition-colors">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-bold text-grace-ink">Brand — adds 5% off production</span>
                <span className="text-[13px] font-black text-grace-ink">$79<span className="text-[10px] font-semibold text-grace-stone">/mo</span></span>
              </div>
              <span className="text-[11px] text-grace-stone">Unlimited size profiles · priority queue · Creative Direction included</span>
            </button>

            {error && <p className="text-[11px] text-red-500 mt-3">{error}</p>}
          </div>

          {/* Divider */}
          <div className="hidden sm:flex flex-col items-center justify-center py-7">
            <div className="w-px flex-1 bg-grace-border" />
            <span className="text-[10px] text-grace-stone font-bold uppercase tracking-widest py-3 px-1">or</span>
            <div className="w-px flex-1 bg-grace-border" />
          </div>
          <div className="sm:hidden mx-7 border-t border-grace-border" />

          {/* Option 2: Go to Production */}
          <div className="p-7">
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-grace-stone mb-1">Start Sample / Production</p>
            <p className="text-[13px] text-grace-stone leading-relaxed mb-5">
              Move your concept into manufacturing. A one-time <strong className="text-grace-ink">$25 setup fee</strong> applies on the Free plan (waived for members).
            </p>

            <div className="p-4 rounded-xl border border-grace-border bg-grace-mist mb-5 space-y-2">
              <p className="text-[10px] font-bold text-grace-stone uppercase tracking-widest">Production includes</p>
              {[
                'Unlimited AI revisions for this project',
                'Sample or direct-to-production path',
                'GRACE production partner network',
              ].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <Check size={11} className="text-grace-ink mt-0.5 shrink-0" />
                  <span className="text-[12px] text-grace-stone">{item}</span>
                </div>
              ))}
            </div>

            <button onClick={handleStartProduction}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-grace-ink text-white text-sm font-bold hover:bg-zinc-800 transition-colors">
              <Package size={14} /> Start Sample or Production
            </button>
            <p className="text-[10px] text-grace-stone mt-2 text-center">$25 setup (Free plan) · waived for Designer &amp; Brand</p>
          </div>
        </div>
      </div>
    </div>
  )
}
