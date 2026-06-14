/**
 * useRealtimeOrder
 *
 * Subscribes to live changes on a single production_orders row and its
 * audit events.  Calls onOrderChange() when the order row is updated and
 * onNewEvent() when a new stage-transition event is inserted.
 *
 * Both portals use this hook so they receive identical, immediate updates
 * when the other party takes an action.
 */

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import type { StageTransitionEvent } from '@/types/productionStages'

interface Options {
  orderId:       string
  onOrderChange: () => void
  onNewEvent?:   (event: StageTransitionEvent) => void
}

export function useRealtimeOrder({ orderId, onOrderChange, onNewEvent }: Options) {
  // Keep stable references so the subscription isn't torn down on every render
  const onOrderChangeRef = useRef(onOrderChange)
  const onNewEventRef    = useRef(onNewEvent)
  onOrderChangeRef.current = onOrderChange
  onNewEventRef.current    = onNewEvent

  useEffect(() => {
    const sb = createClient()
    if (!sb) return

    const channel = sb
      .channel(`order-sync-${orderId}`)
      // Stage / logistics column changes on the order row
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'production_orders',
          filter: `id=eq.${orderId}`,
        },
        () => { onOrderChangeRef.current() },
      )
      // New audit events (carries the transition payload for notifications)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'production_order_events',
          filter: `production_order_id=eq.${orderId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new as {
            from_stage:       string | null
            to_stage:         string
            actor_id?:        string
            metadata:         Record<string, unknown>
            transitioned_at:  string
          }
          onNewEventRef.current?.({
            from_stage:      row.from_stage as StageTransitionEvent['from_stage'],
            to_stage:        row.to_stage   as StageTransitionEvent['to_stage'],
            actor_id:        row.actor_id,
            metadata:        row.metadata ?? {},
            transitioned_at: row.transitioned_at,
          })
          // Also trigger a full reload so order data is fresh
          onOrderChangeRef.current()
        },
      )
      .subscribe()

    return () => { sb.removeChannel(channel) }
  }, [orderId])
}

/**
 * useRealtimeOrderList
 *
 * Subscribes to any UPDATE on production_orders rows belonging to the
 * current session's scope (supplier email or user_id — RLS handles the
 * filter server-side).  Calls onAnyChange() so dashboards refresh.
 */
export function useRealtimeOrderList(onAnyChange: () => void) {
  const callbackRef = useRef(onAnyChange)
  callbackRef.current = onAnyChange

  useEffect(() => {
    const sb = createClient()
    if (!sb) return

    const channel = sb
      .channel('order-list-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'production_orders' },
        () => { callbackRef.current() },
      )
      .subscribe()

    return () => { sb.removeChannel(channel) }
  }, [])
}
