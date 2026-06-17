'use client'

import { useState } from 'react'
import { ArrowLeft, Palette, Sparkles } from 'lucide-react'
import { AppState } from '@/app/page'
import Phase1Logo from './Phase1Logo'
import Phase3Editor from './Phase3Editor'

type Tab = 'logo' | 'design'

interface Props {
  state: AppState
  onComplete: (updates: Partial<AppState>) => void
  onBack: () => void
  onLogoUpdate: (logo: AppState['logo']) => void
  onSetGarment: (garment: AppState['garment']) => void
}

export default function PhaseDesignStudio({ state, onComplete, onBack, onLogoUpdate, onSetGarment }: Props) {
  const [tab, setTab] = useState<Tab>(state.logo ? 'design' : 'logo')
  const [localLogo, setLocalLogo] = useState<AppState['logo']>(state.logo)

  const handleLogoSaved = (logo: AppState['logo']) => {
    setLocalLogo(logo)
    onLogoUpdate(logo)
    setTab('design')
  }

  const handleLogoUpdate = (logo: AppState['logo']) => {
    setLocalLogo(logo)
    onLogoUpdate(logo)
  }

  return (
    <div className="w-full">
      {/* Studio header */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between">
        <div>
          <p className="phase-header">Phase 2</p>
          <h1 className="text-xl font-bold text-gray-900">Design Studio</h1>
          <p className="text-gray-500 text-sm mt-1">Create your logo and apply it to your garment</p>
        </div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mt-1">
          <ArrowLeft size={14}/> Back
        </button>
      </div>

      {/* Tab strip */}
      <div className="px-6 pb-4">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setTab('logo')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === 'logo'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles size={11}/>
            Logo
            {localLogo && <span className="w-1.5 h-1.5 rounded-full bg-brand-green ml-0.5"/>}
          </button>
          <button
            onClick={() => setTab('design')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === 'design'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Palette size={11}/>
            Design
          </button>
        </div>
      </div>

      {/* Tab content — render both but hide the inactive one so canvas state is preserved */}
      <div className={tab === 'logo' ? 'block' : 'hidden'}>
        <Phase1Logo
          state={{ ...state, logo: localLogo }}
          hideHeader
          onComplete={handleLogoSaved}
          onSkip={() => setTab('design')}
          onBack={onBack}
          onLogoUpdate={handleLogoUpdate}
        />
      </div>
      <div className={tab === 'design' ? 'block' : 'hidden'}>
        <Phase3Editor
          state={{ ...state, logo: localLogo }}
          hideHeader
          onComplete={(design) => onComplete({ logo: localLogo, design })}
          onSetGarment={onSetGarment}
          onBack={() => setTab('logo')}
        />
      </div>
    </div>
  )
}
