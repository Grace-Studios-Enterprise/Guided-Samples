'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Phase1Logo from '@/components/Phase1Logo'
import Phase2Garment from '@/components/Phase2Garment'
import Phase3Editor from '@/components/Phase3Editor'
import Phase4TechPack from '@/components/Phase4TechPack'

export type AppState = {
  currentPhase: number
  logo: {
    svg: string
    dataUrl: string
    style: string
    color: string
  } | null
  garment: {
    svg: string
    dataUrl: string
    type: string
    color: string
  } | null
  design: {
    confirmed: boolean
    previewDataUrl: string
  } | null
}

export default function Home() {
  const [state, setState] = useState<AppState>({
    currentPhase: 1,
    logo: null,
    garment: null,
    design: null,
  })

  const goToPhase = (phase: number) => {
    setState(s => ({ ...s, currentPhase: phase }))
  }

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      <Sidebar currentPhase={state.currentPhase} onPhaseChange={goToPhase} state={state} />
      <main className="flex-1 overflow-y-auto">
        {state.currentPhase === 1 && (
          <Phase1Logo
            state={state}
            onComplete={(logo) => {
              setState(s => ({ ...s, logo, currentPhase: 2 }))
            }}
          />
        )}
        {state.currentPhase === 2 && (
          <Phase2Garment
            state={state}
            onComplete={(garment) => {
              setState(s => ({ ...s, garment, currentPhase: 3 }))
            }}
            onBack={() => goToPhase(1)}
          />
        )}
        {state.currentPhase === 3 && (
          <Phase3Editor
            state={state}
            onComplete={(design) => {
              setState(s => ({ ...s, design, currentPhase: 4 }))
            }}
            onBack={() => goToPhase(2)}
          />
        )}
        {state.currentPhase === 4 && (
          <Phase4TechPack
            state={state}
            onBack={() => goToPhase(3)}
          />
        )}
      </main>
    </div>
  )
}
