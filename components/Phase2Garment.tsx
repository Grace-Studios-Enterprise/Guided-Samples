'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { AppState } from '@/app/page'

interface Props {
  state: AppState
  onComplete: (route: 'apparel' | 'uniform') => void
  onBack: () => void
}

export default function Phase2Garment({ onComplete, onBack }: Props) {
  return (
    <div className="p-6 w-full max-w-2xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="phase-header">Phase 1</p>
          <h1 className="text-xl font-bold text-gray-900">Select Your Route</h1>
          <p className="text-gray-500 text-sm mt-1">What are you creating?</p>
        </div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mt-1">
          <ArrowLeft size={14}/>Back
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onComplete('apparel')}
          className="group text-left p-7 rounded-2xl border border-grace-border hover:border-grace-ink transition-all flex flex-col gap-3"
        >
          <p className="text-[10px] font-bold tracking-[0.2em] text-grace-stone uppercase">Self Service</p>
          <div>
            <h2 className="text-lg font-black text-grace-ink uppercase tracking-tight mb-1">Custom Apparel</h2>
            <p className="text-xs text-grace-stone leading-relaxed">
              Hoodies, tees, crewnecks, jackets, pants, and more. Choose your garment, apply your design, and build a full tech pack.
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-grace-ink tracking-widest uppercase mt-auto">
            Select <ArrowRight size={12}/>
          </span>
        </button>

        <button
          onClick={() => onComplete('uniform')}
          className="group text-left p-7 rounded-2xl border border-grace-border hover:border-grace-ink transition-all flex flex-col gap-3"
        >
          <p className="text-[10px] font-bold tracking-[0.2em] text-grace-stone uppercase">Team</p>
          <div>
            <h2 className="text-lg font-black text-grace-ink uppercase tracking-tight mb-1">Team Uniforms</h2>
            <p className="text-xs text-grace-stone leading-relaxed">
              Basketball, football, soccer, baseball, track, volleyball, and 7v7. Built for team roster management and production.
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-grace-ink tracking-widest uppercase mt-auto">
            Select <ArrowRight size={12}/>
          </span>
        </button>
      </div>
    </div>
  )
}
