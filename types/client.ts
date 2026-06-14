/**
 * Client Portal — type definitions
 *
 * Clients make exactly three business decisions in the production workflow:
 *   1. Approve sample → bulk production
 *   2. Request revisions → factory reworks
 *   3. Cancel order
 *
 * All logistics confirmations (receipt, delivery) are handled by GRACE admins.
 * Clients never advance logistical stages — only business decision stages.
 */

import type { ProductionStage } from './productionStages'
import type { ProductionOrder } from './production'

/**
 * The only stage transitions a client is authorised to trigger.
 * All other transitions are supplier- or admin-controlled.
 */
export const CLIENT_CONTROLLED_TRANSITIONS: Partial<
  Record<ProductionStage, ProductionStage[]>
> = {
  CLIENT_SAMPLE_EVALUATION: ['BULK_PRODUCTION', 'REVISION_REQUIRED', 'CANCELLED'],
}

/**
 * Stages where the client has no pending action — GRACE or the factory is working.
 */
export const CLIENT_WAITING_STAGES = new Set<ProductionStage>([
  'PRODUCTION_FILES_RECEIVED',
  'FIRST_PIECE_IN_PRODUCTION',
  'FIRST_PIECE_REVIEW',
  'REVISION_REQUIRED',
  'BULK_PRODUCTION',
  'QUALITY_CHECK',
  'PACKING',
  // Logistics stages advanced by admin, not client
  'SAMPLE_SHIPPED',
  'SAMPLE_DELIVERED',
  'SHIPPED',
])

export type ClientAction = {
  id:              string
  label:           string
  description:     string
  toStage:         ProductionStage
  requiredFields:  ClientActionField[]
  variant:         'primary' | 'secondary' | 'danger'
  confirmMessage?: string
}

export type ClientActionField = {
  key:         string
  label:       string
  type:        'text' | 'textarea'
  placeholder: string
}

export const CLIENT_ACTIONS: Partial<Record<ProductionStage, ClientAction[]>> = {
  CLIENT_SAMPLE_EVALUATION: [
    {
      id:          'approve_sample',
      label:       'Approve — Start Bulk Production',
      description: 'The sample meets your standards. Authorise the factory to begin the full production run.',
      toStage:     'BULK_PRODUCTION',
      requiredFields: [
        { key: 'evaluation_notes', label: 'Approval Notes (optional)', type: 'textarea', placeholder: 'Any notes for the factory…' },
      ],
      variant:        'primary',
      confirmMessage: 'Approving the sample will authorise bulk production. This cannot be undone.',
    },
    {
      id:          'request_revision',
      label:       'Request Revisions',
      description: 'The sample needs changes before bulk production can begin.',
      toStage:     'REVISION_REQUIRED',
      requiredFields: [
        { key: 'revision_notes', label: 'Revision Notes', type: 'textarea', placeholder: 'Describe exactly what needs to be changed…' },
      ],
      variant: 'secondary',
    },
    {
      id:          'cancel_order',
      label:       'Cancel Order',
      description: 'Cancel this production order. This action cannot be undone.',
      toStage:     'CANCELLED',
      requiredFields: [
        { key: 'cancellation_reason', label: 'Cancellation Reason', type: 'textarea', placeholder: 'Why are you cancelling this order?' },
      ],
      variant:        'danger',
      confirmMessage: 'Cancelling this order is permanent and cannot be undone.',
    },
  ],
}

export function clientCanAct(stage: ProductionStage | null): boolean {
  if (!stage) return false
  return stage in CLIENT_CONTROLLED_TRANSITIONS
}

export function clientIsWaiting(stage: ProductionStage | null): boolean {
  if (!stage) return false
  return CLIENT_WAITING_STAGES.has(stage)
}

export function getClientActions(stage: ProductionStage | null): ClientAction[] {
  if (!stage) return []
  return CLIENT_ACTIONS[stage] ?? []
}

export function isClientControlledTransition(
  from: ProductionStage,
  to:   ProductionStage,
): boolean {
  const allowed = CLIENT_CONTROLLED_TRANSITIONS[from] ?? []
  return allowed.includes(to)
}

export type ClientTransitionRequest = {
  order_id: string
  to_stage: ProductionStage
  metadata: Record<string, unknown>
}

export type ClientTransitionResponse =
  | { ok: true;  order: ProductionOrder }
  | { ok: false; errors: string[] }
