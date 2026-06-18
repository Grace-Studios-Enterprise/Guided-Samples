'use client'

import { AppState } from '@/app/page'
import Phase3Editor from './Phase3Editor'

interface Props {
  state: AppState
  onComplete: (updates: Partial<AppState>) => void
  onBack: () => void
  onLogoUpdate: (logo: AppState['logo']) => void
  onSetGarment: (garment: AppState['garment']) => void
  onStudioStateChange: (s: AppState['studioState']) => void
}

export default function PhaseDesignStudio({ state, onComplete, onBack, onLogoUpdate, onSetGarment, onStudioStateChange }: Props) {
  return (
    <Phase3Editor
      state={state}
      onComplete={(design) => onComplete({ design })}
      onLogoUpdate={onLogoUpdate}
      onSetGarment={onSetGarment}
      onBack={onBack}
      onStudioStateChange={onStudioStateChange}
    />
  )
}
