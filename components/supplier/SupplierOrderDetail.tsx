'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Package, Ruler, Palette, MapPin, FileImage, RefreshCw, Loader2 } from 'lucide-react'
import { STAGE_LABELS, STAGE_DESCRIPTIONS, type ProductionStage } from '@/types/productionStages'
import { getSupplierOrder, getOrderMedia, getStageHistory } from '@/lib/supplierPortal'
import type { ProductionOrder } from '@/types/production'
import type { OrderMedia } from '@/types/supplier'
import type { StageTransitionEvent } from '@/types/productionStages'
import StageTimeline from './StageTimeline'
import StageActionPanel from './StageActionPanel'

interface Props {
  orderId:       string
  supplierEmail: string
  onBack:        () => void
}

function StageBadge({ stage }: { stage: ProductionStage | null }) {
  if (!stage) return null
  const isTerminal = stage === 'DELIVERED' || stage === 'CANCELLED'
  const isWarning  = stage === 'REVISION_REQUIRED'

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
      isTerminal && stage === 'DELIVERED' ? 'bg-green-100 text-green-700' :
      isTerminal && stage === 'CANCELLED' ? 'bg-red-100 text-red-600' :
      isWarning                           ? 'bg-amber-100 text-amber-700' :
      'bg-brand-green/10 text-brand-green'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        isTerminal && stage === 'DELIVERED' ? 'bg-green-500' :
        isTerminal && stage === 'CANCELLED' ? 'bg-red-400' :
        isWarning                           ? 'bg-amber-500' :
        'bg-brand-green animate-pulse'
      }`} />
      {STAGE_LABELS[stage]}
    </span>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SupplierOrderDetail({ orderId, supplierEmail, onBack }: Props) {
  const [order,   setOrder]   = useState<ProductionOrder | null>(null)
  const [media,   setMedia]   = useState<OrderMedia[]>([])
  const [history, setHistory] = useState<StageTransitionEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const [ord, med, hist] = await Promise.all([
      getSupplierOrder(orderId),
      getOrderMedia(orderId),
      getStageHistory(orderId),
    ])
    if (!ord) {
      setError('Order not found or you do not have access.')
    } else {
      setOrder(ord)
      setMedia(med)
      setHistory(hist)
    }
    setLoading(false)
  }, [orderId])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-brand-green" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 mb-6">
          <ArrowLeft size={14} /> Back to orders
        </button>
        <div className="card text-center py-12">
          <p className="text-sm text-red-500">{error || 'Order unavailable.'}</p>
        </div>
      </div>
    )
  }

  const tp = order.tech_pack_snapshot
  const si = tp.style_info

  const mediaByStage = media.reduce<Record<string, OrderMedia[]>>((acc, m) => {
    const k = m.stage
    acc[k] = [...(acc[k] ?? []), m]
    return acc
  }, {})

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-2">
            <ArrowLeft size={13} /> All orders
          </button>
          <h1 className="text-xl font-bold text-gray-900">{si.styleName ?? 'Untitled'}</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <StageBadge stage={order.production_stage} />
            <span className="text-xs text-gray-400">{si.garmentType}</span>
            {si.brandName && <span className="text-xs text-gray-400">· {si.brandName}</span>}
          </div>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg hover:bg-slate-100 text-gray-400 hover:text-gray-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

        {/* Left column */}
        <div className="space-y-4">

          {/* Current stage description */}
          {order.production_stage && (
            <div className="card border-brand-green/20 bg-brand-green/5">
              <p className="text-xs font-semibold text-brand-green mb-1">
                {STAGE_LABELS[order.production_stage]}
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                {STAGE_DESCRIPTIONS[order.production_stage]}
              </p>
              {order.revision_notes && order.production_stage === 'REVISION_REQUIRED' && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-[11px] font-semibold text-amber-700 mb-1">Client Revision Notes</p>
                  <p className="text-xs text-amber-800 leading-relaxed">{order.revision_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Supplier notes */}
          {order.supplier_notes && (
            <div className="card">
              <p className="text-xs font-semibold text-gray-900 mb-2">Notes from Brand Owner</p>
              <p className="text-xs text-gray-600 leading-relaxed">{order.supplier_notes}</p>
            </div>
          )}

          {/* Tech Pack snapshot */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Package size={14} className="text-brand-green" />
              <p className="text-xs font-semibold text-gray-900">Tech Pack</p>
              <span className="text-[10px] text-gray-400 ml-auto">Production snapshot — immutable</span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs mb-4">
              {[
                ['Style Name',    si.styleName],
                ['SKU',           si.sku],
                ['Garment Type',  si.garmentType],
                ['Gender',        si.gender],
                ['Size Range',    si.sizeRange],
                ['Fit',           si.fitDescription],
                ['Season',        si.season],
                ['Revision',      si.revision],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-2">
                  <span className="text-gray-400 shrink-0">{k}</span>
                  <span className="text-gray-700 text-right">{v}</span>
                </div>
              ))}
            </div>

            {/* Fabric */}
            {(si.fabricContent || si.fabricWeight || si.construction) && (
              <div className="border-t border-slate-100 pt-3 mb-3">
                <p className="text-[11px] font-medium text-gray-500 mb-2">Fabric & Material</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                  {[
                    ['Content',       si.fabricContent],
                    ['Weight',        si.fabricWeight],
                    ['Construction',  si.construction],
                    ['Finish',        si.fabricFinish],
                    ['Care',          si.careInstructions],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k as string} className="flex justify-between gap-2">
                      <span className="text-gray-400 shrink-0">{k}</span>
                      <span className="text-gray-700 text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pantones */}
            {tp.pantones.length > 0 && (
              <div className="border-t border-slate-100 pt-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Palette size={11} className="text-gray-400" />
                  <p className="text-[11px] font-medium text-gray-500">Pantones</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tp.pantones.map((p, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span
                        className="w-4 h-4 rounded-full border border-white shadow-sm shrink-0"
                        style={{ background: p.color }}
                      />
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logo placements */}
            {tp.placements.length > 0 && (
              <div className="border-t border-slate-100 pt-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={11} className="text-gray-400" />
                  <p className="text-[11px] font-medium text-gray-500">Graphic Placements</p>
                </div>
                <div className="space-y-2">
                  {tp.placements.map((pl, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-medium text-gray-700">{pl.location}: </span>
                      <span className="text-gray-500">{pl.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Measurements */}
            {Object.keys(tp.measurements).length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Ruler size={11} className="text-gray-400" />
                  <p className="text-[11px] font-medium text-gray-500">Measurements (inches)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr>
                        <th className="text-left text-gray-400 pb-1.5 pr-3 font-normal">Point of Measure</th>
                        {['XS','S','M','L','XL','2XL','3XL'].map(s => (
                          <th key={s} className="text-center text-gray-400 pb-1.5 px-1 font-normal w-7">{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(tp.measurements).map(([row, vals]) => (
                        <tr key={row} className="border-t border-slate-50">
                          <td className="py-1 pr-3 text-gray-600 whitespace-nowrap">{row}</td>
                          {(vals as number[]).map((v, i) => (
                            <td key={i} className="py-1 px-1 text-center text-gray-700">{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Uploaded media */}
          {media.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <FileImage size={14} className="text-brand-green" />
                <p className="text-xs font-semibold text-gray-900">Uploaded Media</p>
              </div>
              {Object.entries(mediaByStage).map(([stage, items]) => (
                <div key={stage} className="mb-4 last:mb-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    {STAGE_LABELS[stage as ProductionStage] ?? stage}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {items.map(m => (
                      <a
                        key={m.id}
                        href={m.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-slate-50 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        {m.mime_type?.startsWith('image/') ? (
                          <img
                            src={m.public_url}
                            alt={m.file_name}
                            className="w-full aspect-square object-cover"
                          />
                        ) : (
                          <div className="w-full aspect-square flex flex-col items-center justify-center gap-1 p-2">
                            <FileImage size={20} className="text-gray-300" />
                            <span className="text-[9px] text-gray-400 text-center truncate w-full px-1">
                              {m.file_name}
                            </span>
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Logistics */}
          {(order.tracking_number || order.carrier || order.sample_shipped_at) && (
            <div className="card">
              <p className="text-xs font-semibold text-gray-900 mb-3">Logistics</p>
              <div className="space-y-2 text-xs">
                {order.tracking_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tracking Number</span>
                    <span className="text-gray-700 font-mono">{order.tracking_number}</span>
                  </div>
                )}
                {order.carrier && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Carrier</span>
                    <span className="text-gray-700">{order.carrier}</span>
                  </div>
                )}
                {order.sample_shipped_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sample Shipped</span>
                    <span className="text-gray-700">{formatDate(order.sample_shipped_at)}</span>
                  </div>
                )}
                {order.shipped_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bulk Shipped</span>
                    <span className="text-gray-700">{formatDate(order.shipped_at)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Timeline + Actions */}
        <div className="space-y-4">
          <StageTimeline currentStage={order.production_stage} history={history} />
          <StageActionPanel
            orderId={orderId}
            currentStage={order.production_stage}
            supplierEmail={supplierEmail}
            onTransition={load}
          />
        </div>
      </div>
    </div>
  )
}
