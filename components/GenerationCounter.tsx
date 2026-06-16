'use client'

import { Sparkles } from 'lucide-react'
import { useAICredits } from '@/lib/aiCreditsContext'

export default function GenerationCounter({ className = '' }: { className?: string }) {
  const { freeUsed, freeLimit, creditBalance } = useAICredits()
  const freeRemaining = Math.max(0, freeLimit - freeUsed)

  if (creditBalance > 0) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-grace-mist border border-grace-border ${className}`}>
        <Sparkles size={11} className="text-grace-ink shrink-0" />
        <span className="text-[11px] font-semibold text-grace-ink tabular-nums">
          {creditBalance} AI {creditBalance === 1 ? 'credit' : 'credits'} remaining
        </span>
      </div>
    )
  }

  if (freeRemaining > 0) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border ${
        freeRemaining <= 2
          ? 'bg-amber-50 border-amber-200'
          : 'bg-grace-mist border-grace-border'
      } ${className}`}>
        <Sparkles size={11} className={freeRemaining <= 2 ? 'text-amber-600 shrink-0' : 'text-grace-ink shrink-0'} />
        <span className={`text-[11px] font-semibold tabular-nums ${freeRemaining <= 2 ? 'text-amber-700' : 'text-grace-ink'}`}>
          {freeRemaining} free {freeRemaining === 1 ? 'generation' : 'generations'} left
        </span>
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-50 border border-red-200 ${className}`}>
      <Sparkles size={11} className="text-red-500 shrink-0" />
      <span className="text-[11px] font-semibold text-red-600">No AI generations left</span>
    </div>
  )
}
