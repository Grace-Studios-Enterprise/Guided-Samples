'use client'

import { useState, useEffect, useCallback } from 'react'
import { Package, Filter, RefreshCw, AlertTriangle } from 'lucide-react'
import { listAllOrders, getOrderStageCounts, type StageCount } from '@/lib/adminPortal'
import { STAGE_LABELS, type ProductionStage } from '@/types/productionStages'
import type { ProductionOrder } from '@/types/production'

const NEEDS_ACTION_STAGES = new Set<ProductionStage>(['SAMPLE_SHIPPED', 'SAMPLE_DELIVERED', 'SHIPPED'])

interface Props {
  onSelectOrder: (id: string) => void
}

export default function AdminDashboard({ onSelectOrder }: Props) {
  const [orders,      setOrders]      = useState<ProductionOrder[]>([])
  const [stageCounts, setStageCounts] = useState<StageCount[]>([])
  const [stageFilter, setStageFilter] = useState<ProductionStage | ''>('')
  const [search,      setSearch]      = useState('')
  const [loading,     setLoading]     = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [fetched, counts] = await Promise.all([
      listAllOrders({ stage: stageFilter || undefined }),
      getOrderStageCounts(),
    ])
    setOrders(fetched)
    setStageCounts(counts)
    setLoading(false)
  }, [stageFilter])

  useEffect(() => { load() }, [load])

  const visible = orders.filter(o => {
    if (!search) return true
    const q = search.toLowerCase()
    const email = (o as unknown as Record<string, unknown>).user_email as string ?? ''
    return (
      o.id.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      (o.supplier_email ?? '').toLowerCase().includes(q)
    )
  })

  const totalCount = stageCounts.reduce((s, c) => s + c.count, 0)

  return (
    <div className="space-y-6">
      {/* Stage stat pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStageFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            stageFilter === ''
              ? 'bg-[#184D3E] text-white border-[#184D3E]'
              : 'bg-white text-gray-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          All ({totalCount})
        </button>
        {stageCounts
          .filter(c => c.stage !== null)
          .sort((a, b) => b.count - a.count)
          .map(({ stage, count }) => (
            <button
              key={stage}
              onClick={() => setStageFilter(stage === stageFilter ? '' : stage!)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
                stageFilter === stage
                  ? 'bg-[#184D3E] text-white border-[#184D3E]'
                  : NEEDS_ACTION_STAGES.has(stage!)
                  ? 'bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400'
                  : 'bg-white text-gray-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {NEEDS_ACTION_STAGES.has(stage!) && <AlertTriangle size={10} />}
              {STAGE_LABELS[stage!]} ({count})
            </button>
          ))}
      </div>

      {/* Search + controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order ID or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="btn-secondary flex items-center gap-1.5 text-sm"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Orders table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Order ID</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Client</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Supplier</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Stage</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-12 text-sm">Loading orders…</td>
              </tr>
            )}
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-12 text-sm">No orders found</td>
              </tr>
            )}
            {!loading && visible.map(order => {
              const needsAction = order.production_stage !== null &&
                order.production_stage !== undefined &&
                NEEDS_ACTION_STAGES.has(order.production_stage)
              const userEmail = (order as unknown as Record<string, unknown>).user_email as string ?? '—'
              return (
                <tr
                  key={order.id}
                  onClick={() => onSelectOrder(order.id)}
                  className={`cursor-pointer hover:bg-slate-50 transition-colors ${needsAction ? 'bg-amber-50/40' : ''}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    <span className="flex items-center gap-2">
                      {needsAction && <AlertTriangle size={12} className="text-amber-500 shrink-0" />}
                      <Package size={12} className="text-gray-400 shrink-0" />
                      {order.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{userEmail}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {order.supplier_email ?? <span className="text-gray-300">unassigned</span>}
                  </td>
                  <td className="px-4 py-3">
                    {order.production_stage ? (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                        needsAction ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {STAGE_LABELS[order.production_stage]}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(order.updated_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
