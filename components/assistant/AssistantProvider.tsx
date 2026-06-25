'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_CONTEXT, type AssistantContext } from '@/lib/assistant/types'
import GraceAssistant from './GraceAssistant'

interface AssistantApi {
  context: AssistantContext
  /** Merge partial context from any screen. */
  publish: (partial: Partial<AssistantContext>) => void
  /** Host-supplied handler for navigation/operation action ids. Return true if handled. */
  onAction?: (id: string) => boolean
}

const Ctx = createContext<AssistantApi | null>(null)

export function useAssistant(): AssistantApi {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAssistant must be used within <AssistantProvider>')
  return v
}

export default function AssistantProvider({
  children,
  onAction,
}: {
  children: ReactNode
  onAction?: (id: string) => boolean
}) {
  const [context, setContext] = useState<AssistantContext>(DEFAULT_CONTEXT)

  const publish = useCallback((partial: Partial<AssistantContext>) => {
    setContext(prev => ({ ...prev, ...partial }))
  }, [])

  const api = useMemo<AssistantApi>(() => ({ context, publish, onAction }), [context, publish, onAction])

  return (
    <Ctx.Provider value={api}>
      {children}
      <GraceAssistant />
    </Ctx.Provider>
  )
}
