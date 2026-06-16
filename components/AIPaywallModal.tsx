'use client'

import { useState } from 'react'
import { X, Sparkles, ArrowRight, Check, Package } from 'lucide-react'
import { CREDIT_PACKS } from '@/lib/aiCredits'
import { useAICredits } from '@/lib/aiCreditsContext'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase'

interface Props {
  /** Called when the user selects "Start Sample / Production" path. */
  onStartProduction?: () => void
}

export default function AIPaywallModal({ onStartProduction }: Props) {
  const { isPaywallOpen, closePaywall } = useAICredits()
  const { user } = useAuth()
  const [buying, setBuying] = useState<string | null>(null)
  const [buyError, setBuyError] = useState('')

  if (!isPaywallOpen) return null

  const handleBuyCredits = async (packId: string) => {
    setBuyError('')
    if (!user) {
      setBuyError('Please sign in to purchase AI credits.')
      return
    }
    setBuying(packId)
    try {
      const sb = createClient()
      const token = sb ? (await sb.auth.getSession()).data.session?.access_token : null
      const res = await fetch('/api/checkout/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pack_id: packId }),
      })
      const json = await res.json()
      if (!res.ok || json.error) { setBuyError(json.error ?? 'Checkout failed.'); return }
      window.location.href = json.url
    } catch {
      setBuyError('Something went wrong. Please try again.')
    } finally {
      setBuying(null)
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
          <button
            onClick={closePaywall}
            className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-grace-mist flex items-center justify-center text-grace-stone transition-colors"
          >
            <X size={15} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-grace-ink flex items-center justify-center mb-3">
            <Sparkles size={18} className="text-white" />
          </div>
          <h2 className="text-xl font-black text-grace-ink tracking-tight">
            You've used your free AI generations
          </h2>
          <p className="text-[13px] text-grace-stone mt-1 leading-relaxed">
            Continue designing with AI credits, or move your concept into production.
          </p>
        </div>

        {/* Body — two panels */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-0">

          {/* Option 1: Buy Credits */}
          <div className="p-7">
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-grace-stone mb-1">Continue Designing</p>
            <p className="text-[13px] text-grace-stone leading-relaxed mb-5">
              Purchase AI credit packs to keep exploring ideas. Credits never expire and apply toward your $25 activation fee when you move into production.
            </p>

            <div className="space-y-2">
              {CREDIT_PACKS.map(pack => {
                const isActive = buying === pack.id
                return (
                  <button
                    key={pack.id}
                    onClick={() => handleBuyCredits(pack.id)}
                    disabled={!!buying}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                      isActive
                        ? 'border-grace-ink bg-grace-ink'
                        : 'border-grace-border hover:border-grace-ink hover:bg-grace-mist'
                    }`}
                  >
                    <div>
                      <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-grace-ink'}`}>
                        {pack.label}
                      </span>
                      {pack.generations === 60 && (
                        <span className="ml-2 text-[9px] font-bold uppercase tracking-widest text-grace-stone bg-grace-mist px-1.5 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${isActive ? 'text-white' : 'text-grace-ink'}`}>
                        {pack.price_label}
                      </span>
                      {isActive
                        ? <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                        : <ArrowRight size={13} className="text-grace-stone" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {buyError && (
              <p className="text-[11px] text-red-500 mt-3">{buyError}</p>
            )}

            <p className="text-[10px] text-grace-stone mt-3 leading-relaxed">
              Credits apply toward your $25 activation fee if you start a production order.
            </p>
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
              The $25 activation fee unlocks unlimited AI revisions for your active project while moving it into manufacturing.
            </p>

            <div className="p-4 rounded-xl border border-grace-border bg-grace-mist mb-5 space-y-2">
              <p className="text-[10px] font-bold text-grace-stone uppercase tracking-widest">Activation includes</p>
              {[
                'Unlimited AI generations for this project',
                'Sample or direct-to-production path',
                'GRACE production partner network',
              ].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <Check size={11} className="text-grace-ink mt-0.5 shrink-0" />
                  <span className="text-[12px] text-grace-stone">{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleStartProduction}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-grace-ink text-white text-sm font-bold hover:bg-zinc-800 transition-colors"
            >
              <Package size={14} /> Start Sample or Production
            </button>
            <p className="text-[10px] text-grace-stone mt-2 text-center">
              $25 activation · Unlimited AI for this project
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
