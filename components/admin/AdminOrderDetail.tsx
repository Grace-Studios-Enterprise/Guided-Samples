'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, FileText, Image, Clock, User, Edit3, Loader2 } from 'lucide-react'
import {
  getAdminOrder,
  getAdminOrderMedia,
  getAdminOrderHistory,
  addAdminNote,
  reassignSupplier,
} from '@/lib/adminPortal'
import AdminStageOverride from './AdminStageOverride'
import { STAGE_LABELS } from '@/types/productionStages'
import type { ProductionOrder } from '@/types/production'
import type { OrderMedia } from '@/types/supplier'
import type { StageTransitionEvent } from '@/types/productionStages'

type Tab = 'stage' | 'info' | 'media' | 'log'

interface Props {
  orderId: string
  onBack:  () => void
}

export default function AdminOrderDetail({ orderId, onBack }: Props) {
  const [order,   setOrder]   = useState<ProductionOrder | null>(null)
  const [media,   setMedia]   = useState<OrderMedia[]>([])
  const [history, setHistory] = useState<StageTransitionEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<Tab>('stage')

  const [note,         setNote]         = useState('')
  const [noteLoading,  setNoteLoading]  = useState(false)
  const [noteError,    setNoteError]    = useState('')

  const [newSupplier,    setNewSupplier]    = useState('')
  const [supplierLoading, setSupplierLoading] = useState(false)
  const [supplierError,   setSupplierError]   = useState('')
  const [supplierSuccess, setSupplierSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [o, m, h] = await Promise.all([
      getAdminOrder(orderId),
      getAdminOrderMedia(orderId),
      getAdminOrderHistory(orderId),
    ])
    setOrder(o)
    setMedia(m)
    setHistory(h)
    setLoading(false)
  }, [orderId])

  useEffect(() => { load() }, [load])

  async function submitNote() {
    if (!note.trim()) return
    setNoteLoading(true); setNoteError('')
    const res = await addAdminNote(orderId, note.trim())
    setNoteLoading(false)
    if (res.ok) { setNote(''); load() }
    else setNoteError(res.error ?? 'Failed to add note')
  }

  async function submitReassign() {
    if (!newSupplier.trim() || !order) return
    setSupplierLoading(true); setSupplierError(''); setSupplierSuccess('')
    // Admin email not accessible client-side without auth call; pass empty and let API fill it
    const res = await reassignSupplier(orderId, newSupplier.trim(), '')
    setSupplierLoading(false)
    if (res.ok) { setSupplierSuccess('Supplier updated'); setNewSupplier(''); load() }
    else setSupplierError(res.error ?? 'Failed to reassign supplier')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-24 text-gray-400 text-sm">Order not found.</div>
    )
  }

  const adminNoteEvents = history.filter(
    e => (e as unknown as Record<string, unknown>)._event_type === 'admin_note'
  )

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'stage', label: 'Stage Control', icon: <Edit3 size={13} /> },
    { id: 'info',  label: 'Order Info',    icon: <FileText size={13} /> },
    { id: 'media', label: 'Media',         icon: <Image size={13} /> },
    { id: 'log',   label: 'Audit Log',     icon: <Clock size={13} /> },
  ]

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button onClick={onBack} className="btn-secondary flex items-center gap-1.5 text-sm mt-0.5">
          <ArrowLeft size={13} /> Back
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-gray-800 font-mono">
              {order.id.slice(0, 8)}…
            </h2>
            {order.production_stage && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#0A0A0A]/10 text-[#0A0A0A] font-medium">
                {STAGE_LABELS[order.production_stage]}
              </span>
            )}
          </div>
          <div className="flex gap-4 mt-1 text-xs text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <User size={11} />
              {(order as unknown as Record<string, unknown>).user_email as string ?? '—'}
            </span>
            {order.supplier_email && (
              <span className="flex items-center gap-1">
                <User size={11} className="text-[#0A0A0A]" />
                {order.supplier_email}
              </span>
            )}
            <span>Created {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-[#0A0A0A] text-[#0A0A0A]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tab === 'stage' && (
        <div className="space-y-6">
          <div className="card">
            <AdminStageOverride
              orderId={orderId}
              currentStage={order.production_stage}
              onTransition={load}
            />
          </div>

          {/* Supplier reassignment */}
          <div className="card space-y-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Supplier Reassignment</p>
            <p className="text-xs text-gray-500">
              Current: <span className="font-medium text-gray-700">{order.supplier_email ?? 'unassigned'}</span>
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="New supplier email…"
                value={newSupplier}
                onChange={e => setNewSupplier(e.target.value)}
                className="input-field text-sm flex-1"
              />
              <button
                onClick={submitReassign}
                disabled={!newSupplier.trim() || supplierLoading}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                {supplierLoading ? <Loader2 size={13} className="animate-spin" /> : 'Reassign'}
              </button>
            </div>
            {supplierError   && <p className="text-xs text-red-500">{supplierError}</p>}
            {supplierSuccess && <p className="text-xs text-[#0A0A0A]">{supplierSuccess}</p>}
          </div>

          {/* Internal notes */}
          <div className="card space-y-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Internal Notes</p>
            {adminNoteEvents.length > 0 && (
              <div className="space-y-2">
                {adminNoteEvents.map((e, i) => {
                  const meta = e as unknown as Record<string, unknown>
                  return (
                    <div key={i} className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-gray-600">
                      <p className="text-[10px] text-gray-400 mb-1">
                        {String(meta.admin_email ?? 'admin')} · {new Date(e.transitioned_at).toLocaleString()}
                      </p>
                      {String(meta.note ?? '')}
                    </div>
                  )
                })}
              </div>
            )}
            <textarea
              className="textarea-field text-sm"
              rows={3}
              placeholder="Add internal note…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            {noteError && <p className="text-xs text-red-500">{noteError}</p>}
            <button
              onClick={submitNote}
              disabled={!note.trim() || noteLoading}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              {noteLoading ? <Loader2 size={13} className="animate-spin" /> : 'Add Note'}
            </button>
          </div>
        </div>
      )}

      {tab === 'info' && (
        <div className="card space-y-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Tech Pack Snapshot</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ['Product Type',       order.tech_pack_snapshot?.style_info?.product_type ?? '—'],
              ['Quantity',           order.tech_pack_snapshot?.style_info?.quantity ?? '—'],
              ['Target Price / Unit', order.tech_pack_snapshot?.style_info?.target_price_per_unit
                ? `${order.tech_pack_snapshot.style_info.target_price_per_unit} ${order.tech_pack_snapshot.style_info.currency ?? ''}`
                : '—'],
              ['Delivery Deadline',  order.tech_pack_snapshot?.style_info?.delivery_deadline ?? '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-400 mb-0.5">{label}</dt>
                <dd className="font-medium text-gray-700">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {tab === 'media' && (
        <div className="space-y-4">
          {media.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No media uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {media.map(m => (
                <a
                  key={m.id}
                  href={m.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card p-2 space-y-1 hover:shadow-md transition-shadow group"
                >
                  {m.mime_type?.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.public_url}
                      alt={m.file_name}
                      className="w-full aspect-square object-cover rounded-md bg-slate-100"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-slate-100 rounded-md flex items-center justify-center">
                      <FileText size={24} className="text-gray-400" />
                    </div>
                  )}
                  <p className="text-[11px] text-gray-500 truncate">{m.file_name}</p>
                  {m.notes && <p className="text-[10px] text-gray-400 truncate">{m.notes}</p>}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'log' && (
        <div className="space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No history yet.</p>
          ) : (
            history.map((e, i) => {
              const meta = e as unknown as Record<string, unknown>
              const eventType = meta._event_type as string
              const isNote = eventType === 'admin_note'
              return (
                <div key={i} className="card flex gap-3 items-start">
                  <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isNote ? 'bg-blue-50 text-blue-500' : 'bg-[#0A0A0A]/10 text-[#0A0A0A]'
                  }`}>
                    {isNote ? <Edit3 size={11} /> : <Clock size={11} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[10px] text-gray-400">
                      {new Date(e.transitioned_at).toLocaleString()}
                      {!!meta.admin_email && <> · {String(meta.admin_email)}</>}
                    </p>
                    {isNote ? (
                      <p className="text-xs text-gray-700 mt-0.5">{meta.note as string}</p>
                    ) : (
                      <p className="text-xs text-gray-700 mt-0.5">
                        {eventType?.replace(/_/g, ' ')}
                        {e.from_stage && e.to_stage && (
                          <span className="text-gray-400">
                            {' '}— {STAGE_LABELS[e.from_stage] ?? e.from_stage} → {STAGE_LABELS[e.to_stage] ?? e.to_stage}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
