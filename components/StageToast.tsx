'use client'

/**
 * StageToast
 *
 * Displays a transient notification when the production stage changes due to
 * an action taken by the other party.  Appears in the bottom-right corner and
 * auto-dismisses after 5 seconds.
 *
 * Usage:
 *   const { toasts, notify } = useStageToasts()
 *   <StageToastContainer toasts={toasts} onDismiss={dismiss} />
 *
 *   // on a new realtime event:
 *   notify(event, currentUserId)
 */

import { useState, useCallback, useEffect } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { STAGE_LABELS, type ProductionStage } from '@/types/productionStages'
import type { StageTransitionEvent } from '@/types/productionStages'

// ─── Toast state ──────────────────────────────────────────────────────────────

export type Toast = {
  id:      string
  message: string
  detail?: string
  kind:    'info' | 'action' | 'warning'
}

let _toastId = 0
function nextId() { return String(++_toastId) }

function buildToastFromEvent(
  event:         StageTransitionEvent,
  currentUserId: string | undefined,
): Toast | null {
  // Suppress toasts for the actor's own transitions
  if (event.actor_id && event.actor_id === currentUserId) return null
  if (!event.to_stage) return null

  const toLabel   = STAGE_LABELS[event.to_stage as ProductionStage]
  const fromLabel = event.from_stage ? STAGE_LABELS[event.from_stage as ProductionStage] : null

  const kind: Toast['kind'] =
    event.to_stage === 'CANCELLED'         ? 'warning' :
    event.to_stage === 'REVISION_REQUIRED' ? 'warning' :
    'action'

  return {
    id:      nextId(),
    message: toLabel,
    detail:  fromLabel ? `Updated from "${fromLabel}"` : undefined,
    kind,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStageToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((event: StageTransitionEvent, currentUserId?: string) => {
    const toast = buildToastFromEvent(event, currentUserId)
    if (!toast) return
    setToasts(prev => [...prev, toast])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, notify, dismiss }
}

// ─── Single toast ─────────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm max-w-xs w-full animate-in slide-in-from-right-4 duration-300 ${
      toast.kind === 'warning'
        ? 'bg-amber-50 border-amber-200'
        : 'bg-white border-slate-200'
    }`}>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold leading-tight ${
          toast.kind === 'warning' ? 'text-amber-700' : 'text-gray-800'
        }`}>
          <ArrowRight size={10} className="inline mr-1 opacity-60" />
          {toast.message}
        </p>
        {toast.detail && (
          <p className="text-[11px] text-gray-400 mt-0.5">{toast.detail}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5"
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ─── Container ────────────────────────────────────────────────────────────────

export function StageToastContainer({
  toasts,
  onDismiss,
}: {
  toasts:    Toast[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={() => onDismiss(t.id)} />
        </div>
      ))}
    </div>
  )
}
