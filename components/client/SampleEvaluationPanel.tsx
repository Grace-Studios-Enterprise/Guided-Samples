'use client'

/**
 * SampleEvaluationPanel
 *
 * Dedicated decision UI shown when a production order is in one of the
 * sample-evaluation stages:
 *
 *   SAMPLE_SHIPPED         → client confirms receipt
 *   SAMPLE_DELIVERED       → client begins formal evaluation
 *   CLIENT_SAMPLE_EVALUATION → client approves, requests revision, or cancels
 *
 * Revision requests loop back into the sample workflow (→ REVISION_REQUIRED →
 * factory reworks → FIRST_PIECE_IN_PRODUCTION → … → SAMPLE_SHIPPED again).
 */

import { useState } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Package,
} from 'lucide-react'
import { clientTransition } from '@/lib/clientPortal'
import type { ProductionStage } from '@/types/productionStages'
import { STAGE_LABELS } from '@/types/productionStages'
import type { OrderMedia } from '@/types/supplier'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  orderId:      string
  stage:        ProductionStage
  media:        OrderMedia[]
  onTransition: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Decision = 'approve' | 'revise' | 'cancel' | null

// ─── Mini media viewer ────────────────────────────────────────────────────────

function SamplePhotoGrid({ media }: { media: OrderMedia[] }) {
  const [expanded, setExpanded] = useState(false)

  const photos = media.filter(m =>
    m.mime_type?.startsWith('image/') ||
    m.media_type === 'first_piece_review' ||
    m.media_type === 'revised_sample'
  )

  if (photos.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <Package size={16} className="text-gray-300 shrink-0" />
        <p className="text-xs text-gray-400">No sample photos uploaded yet. Check back later.</p>
      </div>
    )
  }

  const visible = expanded ? photos : photos.slice(0, 3)
  const hidden  = photos.length - 3

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {visible.map((m, i) => (
          <a
            key={m.id}
            href={m.public_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative group rounded-xl overflow-hidden bg-slate-100 aspect-square hover:opacity-90 transition-opacity"
          >
            <img
              src={m.public_url}
              alt={m.file_name}
              className="w-full h-full object-cover"
            />
            {/* show "and N more" overlay on last visible if collapsed */}
            {!expanded && i === 2 && hidden > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">+{hidden}</span>
              </div>
            )}
          </a>
        ))}
      </div>
      {photos.length > 3 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 flex items-center gap-1 text-[11px] text-brand-green hover:text-brand-green/70 transition-colors"
        >
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {expanded ? 'Show less' : `Show all ${photos.length} photos`}
        </button>
      )}
    </div>
  )
}

// ─── Receipt confirmation (SAMPLE_SHIPPED → SAMPLE_DELIVERED) ────────────────

function ConfirmReceiptStep({
  orderId,
  onTransition,
}: {
  orderId: string
  onTransition: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  async function confirm() {
    setSubmitting(true)
    setError('')
    const res = await clientTransition({ order_id: orderId, to_stage: 'SAMPLE_DELIVERED', metadata: {} })
    setSubmitting(false)
    if (res.ok) onTransition()
    else setError(res.errors.join(', '))
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-brand-green/5 border border-brand-green/20 rounded-xl">
        <p className="text-xs font-semibold text-brand-green mb-1">Sample in Transit</p>
        <p className="text-xs text-gray-600 leading-relaxed">
          Your physical sample is on its way. Once it arrives, confirm receipt to begin your evaluation.
        </p>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={confirm}
        disabled={submitting}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {submitting
          ? <><Loader2 size={13} className="animate-spin" /> Confirming…</>
          : <><CheckCircle2 size={13} /> Confirm Sample Received</>}
      </button>
    </div>
  )
}

// ─── Begin evaluation (SAMPLE_DELIVERED → CLIENT_SAMPLE_EVALUATION) ───────────

function BeginEvaluationStep({
  orderId,
  media,
  onTransition,
}: {
  orderId:      string
  media:        OrderMedia[]
  onTransition: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  async function begin() {
    setSubmitting(true)
    setError('')
    const res = await clientTransition({ order_id: orderId, to_stage: 'CLIENT_SAMPLE_EVALUATION', metadata: {} })
    setSubmitting(false)
    if (res.ok) onTransition()
    else setError(res.errors.join(', '))
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-brand-green/5 border border-brand-green/20 rounded-xl">
        <p className="text-xs font-semibold text-brand-green mb-1">Sample Delivered</p>
        <p className="text-xs text-gray-600 leading-relaxed">
          Review the sample photos below, then begin your formal evaluation. You'll decide whether to
          approve bulk production, request changes, or cancel the order.
        </p>
      </div>

      <SamplePhotoGrid media={media} />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={begin}
        disabled={submitting}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {submitting
          ? <><Loader2 size={13} className="animate-spin" /> Starting…</>
          : 'Begin Sample Evaluation'}
      </button>
    </div>
  )
}

// ─── Revision form ────────────────────────────────────────────────────────────

function RevisionForm({
  orderId,
  onTransition,
  onCancel,
}: {
  orderId:      string
  onTransition: () => void
  onCancel:     () => void
}) {
  const [notes, setNotes]       = useState('')
  const [submitting, setSubmit] = useState(false)
  const [error, setError]       = useState('')

  async function submit() {
    if (!notes.trim()) { setError('Please describe what needs to change.'); return }
    setSubmit(true)
    setError('')
    const res = await clientTransition({
      order_id: orderId,
      to_stage: 'REVISION_REQUIRED',
      metadata: { revision_notes: notes.trim() },
    })
    setSubmit(false)
    if (res.ok) onTransition()
    else setError(res.errors.join(', '))
  }

  return (
    <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/30 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-800">Request Revisions</p>
          <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
            Be specific. The factory will restart production based on these notes.
            The sample loop will begin again after revisions.
          </p>
        </div>
      </div>

      <textarea
        className="textarea-field text-xs"
        rows={4}
        placeholder="e.g. The shoulder seam sits 1.5 cm too wide. The collar rib needs to be tighter. Please refer to measurement spec row 3…"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        autoFocus
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-secondary flex-1 text-xs" disabled={submitting}>
          Back
        </button>
        <button
          onClick={submit}
          disabled={!notes.trim() || submitting}
          className="flex-1 text-xs px-4 py-2 rounded-lg font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50"
        >
          {submitting ? <Loader2 size={13} className="animate-spin mx-auto" /> : 'Submit Revision Request'}
        </button>
      </div>
    </div>
  )
}

// ─── Cancellation form ────────────────────────────────────────────────────────

function CancellationForm({
  orderId,
  onTransition,
  onCancel,
}: {
  orderId:      string
  onTransition: () => void
  onCancel:     () => void
}) {
  const [reason, setReason]     = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmit] = useState(false)
  const [error, setError]       = useState('')

  async function submit() {
    if (!reason.trim()) { setError('Please provide a cancellation reason.'); return }
    if (!confirmed)     { setError('Please confirm that you understand this cannot be undone.'); return }
    setSubmit(true)
    setError('')
    const res = await clientTransition({
      order_id: orderId,
      to_stage: 'CANCELLED',
      metadata: { cancellation_reason: reason.trim() },
    })
    setSubmit(false)
    if (res.ok) onTransition()
    else setError(res.errors.join(', '))
  }

  return (
    <div className="border border-red-200 rounded-xl p-4 bg-red-50/30 space-y-3">
      <div className="flex items-start gap-2">
        <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-red-700">Cancel Order</p>
          <p className="text-[11px] text-red-600 mt-0.5 leading-relaxed">
            This is permanent and cannot be reversed. The factory will be notified immediately.
          </p>
        </div>
      </div>

      <textarea
        className="textarea-field text-xs border-red-200 focus:ring-red-300"
        rows={3}
        placeholder="Why are you cancelling this order?"
        value={reason}
        onChange={e => setReason(e.target.value)}
        autoFocus
      />

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 w-3.5 h-3.5 accent-red-500"
          checked={confirmed}
          onChange={e => setConfirmed(e.target.checked)}
        />
        <span className="text-[11px] text-red-700 leading-relaxed">
          I understand this cancellation is permanent and the factory will stop work immediately.
        </span>
      </label>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-secondary flex-1 text-xs" disabled={submitting}>
          Back
        </button>
        <button
          onClick={submit}
          disabled={!reason.trim() || !confirmed || submitting}
          className="flex-1 text-xs px-4 py-2 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
        >
          {submitting ? <Loader2 size={13} className="animate-spin mx-auto" /> : 'Cancel Order'}
        </button>
      </div>
    </div>
  )
}

// ─── Approval confirmation ────────────────────────────────────────────────────

function ApprovalForm({
  orderId,
  onTransition,
  onCancel,
}: {
  orderId:      string
  onTransition: () => void
  onCancel:     () => void
}) {
  const [notes, setNotes]       = useState('')
  const [submitting, setSubmit] = useState(false)
  const [error, setError]       = useState('')

  async function submit() {
    setSubmit(true)
    setError('')
    const res = await clientTransition({
      order_id: orderId,
      to_stage: 'BULK_PRODUCTION',
      metadata: { evaluation_notes: notes.trim() || undefined },
    })
    setSubmit(false)
    if (res.ok) onTransition()
    else setError(res.errors.join(', '))
  }

  return (
    <div className="border border-brand-green/30 rounded-xl p-4 bg-brand-green/5 space-y-3">
      <div className="flex items-start gap-2">
        <CheckCircle2 size={14} className="text-brand-green shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-brand-green">Approve for Bulk Production</p>
          <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
            Authorise the factory to begin the full production run. Any notes will be shared with the factory.
          </p>
        </div>
      </div>

      <textarea
        className="textarea-field text-xs"
        rows={2}
        placeholder="Optional: any notes for the factory before bulk production begins…"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-secondary flex-1 text-xs" disabled={submitting}>
          Back
        </button>
        <button
          onClick={submit}
          disabled={submitting}
          className="btn-primary flex-1 text-xs flex items-center justify-center gap-1.5"
        >
          {submitting
            ? <><Loader2 size={13} className="animate-spin" /> Approving…</>
            : <><CheckCircle2 size={13} /> Approve & Start Bulk</>}
        </button>
      </div>
    </div>
  )
}

// ─── Main evaluation screen (CLIENT_SAMPLE_EVALUATION) ───────────────────────

function EvaluationDecisionStep({
  orderId,
  media,
  onTransition,
}: {
  orderId:      string
  media:        OrderMedia[]
  onTransition: () => void
}) {
  const [decision, setDecision] = useState<Decision>(null)

  if (decision === 'approve') {
    return <ApprovalForm orderId={orderId} onTransition={onTransition} onCancel={() => setDecision(null)} />
  }
  if (decision === 'revise') {
    return <RevisionForm orderId={orderId} onTransition={onTransition} onCancel={() => setDecision(null)} />
  }
  if (decision === 'cancel') {
    return <CancellationForm orderId={orderId} onTransition={onTransition} onCancel={() => setDecision(null)} />
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-brand-green/5 border border-brand-green/20 rounded-xl">
        <p className="text-xs font-semibold text-brand-green mb-1">Sample Evaluation</p>
        <p className="text-xs text-gray-600 leading-relaxed">
          Review the sample photos carefully. Your decision determines whether the factory proceeds
          to bulk production, reworks the sample, or stops the order.
        </p>
      </div>

      {/* Sample photos */}
      <SamplePhotoGrid media={media} />

      {/* Three decisions */}
      <div className="space-y-2 pt-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Your Decision</p>

        <button
          onClick={() => setDecision('approve')}
          className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-brand-green/30 bg-brand-green/5 hover:bg-brand-green/10 hover:border-brand-green/50 transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0 group-hover:bg-brand-green/20 transition-colors">
            <CheckCircle2 size={15} className="text-brand-green" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">Approve — Start Bulk Production</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Sample meets your standards. Authorise the full run.</p>
          </div>
        </button>

        <button
          onClick={() => setDecision('revise')}
          className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 hover:bg-amber-50 hover:border-amber-300 transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
            <AlertTriangle size={15} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">Request Revisions</p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Something needs to change. The factory will rework the sample.
            </p>
          </div>
        </button>

        <button
          onClick={() => setDecision('cancel')}
          className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50/30 transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-red-100 flex items-center justify-center shrink-0 transition-colors">
            <XCircle size={15} className="text-gray-400 group-hover:text-red-500 transition-colors" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 group-hover:text-red-700 transition-colors">Cancel Order</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Stop production. This cannot be undone.</p>
          </div>
        </button>
      </div>
    </div>
  )
}

// ─── Exported component ───────────────────────────────────────────────────────

const EVALUATION_STAGES = new Set<ProductionStage>([
  'SAMPLE_SHIPPED',
  'SAMPLE_DELIVERED',
  'CLIENT_SAMPLE_EVALUATION',
])

export function isSampleEvaluationStage(stage: ProductionStage | null): boolean {
  return !!stage && EVALUATION_STAGES.has(stage)
}

export default function SampleEvaluationPanel({ orderId, stage, media, onTransition }: Props) {
  const stageLabel = STAGE_LABELS[stage]

  return (
    <div className="card border-brand-green/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-brand-green flex items-center justify-center shrink-0">
          <Package size={11} className="text-white" />
        </div>
        <p className="text-xs font-semibold text-gray-900">Sample Evaluation</p>
        <span className="ml-auto text-[10px] font-medium px-2 py-0.5 bg-brand-green/10 text-brand-green rounded-full">
          {stageLabel}
        </span>
      </div>

      {stage === 'SAMPLE_SHIPPED'           && <ConfirmReceiptStep orderId={orderId} onTransition={onTransition} />}
      {stage === 'SAMPLE_DELIVERED'         && <BeginEvaluationStep orderId={orderId} media={media} onTransition={onTransition} />}
      {stage === 'CLIENT_SAMPLE_EVALUATION' && <EvaluationDecisionStep orderId={orderId} media={media} onTransition={onTransition} />}
    </div>
  )
}
