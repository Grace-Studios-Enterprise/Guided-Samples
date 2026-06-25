// GRACE Assistant — a context-aware production concierge available on every path.
//
// Any screen publishes an AssistantContext; the advisor turns it into plain-English
// guidance + guided quick actions. Designed so a real LLM endpoint can replace the
// heuristic advisor without changing the UI or the context contract.

import type { PrepressReport } from '@/lib/prepress/types'

export type PathType =
  | 'landing'
  | 'creative'    // Creative Direction / Full Service
  | 'studio'      // Self Service Design Studio (see currentStage)
  | 'upload'      // Upload Production Files / Production Review
  | 'techpack'    // Tech Pack
  | 'checkout'    // Checkout / payment gate
  | 'orders'      // Order Status / production tracking

export interface DesignSummary {
  garment?: string
  hasLogo?: boolean
  phase?: number
}

export interface QuickAction {
  id: string
  label: string
  tone?: 'primary' | 'ghost'
  /** Ask the assistant this (user-perspective). */
  say?: string
  /** Run a registered action handler (see actions.ts). */
  run?: string
}

export interface AssistantContext {
  pathType: PathType
  currentStage?: string
  projectId?: string | null
  orderId?: string | null
  designState?: DesignSummary | null
  uploadedFiles?: { name: string; kind: string }[]
  prepressReport?: PrepressReport | null
  missingItems?: string[]
  availableActions?: QuickAction[]
}

export interface AssistantMessage {
  id: string
  role: 'assistant' | 'user'
  text: string
  actions?: QuickAction[]
}

export const DEFAULT_CONTEXT: AssistantContext = { pathType: 'landing' }
