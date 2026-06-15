'use client'

import { useMemo, useState } from 'react'
import { Ruler, Pencil, Check, X, RotateCcw } from 'lucide-react'
import {
  getConsumerSizeGuide,
  fitLabel,
  formatInches,
  type SizeGuideOverrides,
} from '@/lib/fitBlocks/sizeGuide'
import { getAllGarmentTypes } from '@/lib/fitBlocks'
import type { GarmentType, FitVariant, SizeKey } from '@/lib/fitBlocks/types'

interface Props {
  /** Garment to show. Defaults to short_sleeve_tee. */
  garmentType?: GarmentType
  /** Initial fit. Defaults to the garment's benchmark fit. */
  fit?: FitVariant
  /** Allow the user to switch garments. Default true. */
  allowGarmentSwitch?: boolean
  /** Show the "Edit Size Guide" affordance. Default true. */
  editable?: boolean
  /** Persisted overrides (consumer measurements only). */
  overrides?: SizeGuideOverrides
  /** Called when the user saves edits. */
  onOverridesChange?: (next: SizeGuideOverrides) => void
}

const GARMENT_LABELS: Record<GarmentType, string> = {
  short_sleeve_tee: 'Short Sleeve Tee',
  long_sleeve_tee:  'Long Sleeve Tee',
  crewneck:         'Crewneck',
  hoodie:           'Hoodie',
  zip_hoodie:       'Zip Hoodie',
  track_jacket:     'Track Jacket',
  windbreaker:      'Windbreaker',
  sweatpants:       'Sweatpants',
  track_pants:      'Track Pants',
  shorts:           'Shorts',
}

export default function SizeGuide({
  garmentType: initialGarment = 'short_sleeve_tee',
  fit: initialFit,
  allowGarmentSwitch = true,
  editable = true,
  overrides: externalOverrides,
  onOverridesChange,
}: Props) {
  const [garment, setGarment] = useState<GarmentType>(initialGarment)
  const [fit, setFit] = useState<FitVariant | undefined>(initialFit)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<SizeGuideOverrides>(externalOverrides ?? {})

  // The committed overrides drive the displayed table; the draft is the in-edit copy.
  const activeOverrides = editing ? draft : (externalOverrides ?? {})

  const guide = useMemo(
    () => getConsumerSizeGuide(garment, fit, activeOverrides),
    [garment, fit, activeOverrides],
  )

  if (!guide) {
    return <div className="p-6 text-sm text-grace-stone">No size guide available for this garment.</div>
  }

  const resolvedFit = guide.fit

  function setDraftValue(measurementKey: string, size: SizeKey, raw: string) {
    const value = parseFloat(raw)
    setDraft(prev => {
      const next: SizeGuideOverrides = JSON.parse(JSON.stringify(prev))
      next[garment]       ??= {}
      next[garment][resolvedFit] ??= {}
      next[garment][resolvedFit][measurementKey] ??= {}
      if (Number.isFinite(value)) {
        next[garment][resolvedFit][measurementKey][size] = value
      } else {
        delete next[garment][resolvedFit][measurementKey][size]
      }
      return next
    })
  }

  function startEdit() {
    setDraft(externalOverrides ?? {})
    setEditing(true)
  }

  function cancelEdit() {
    setDraft(externalOverrides ?? {})
    setEditing(false)
  }

  function saveEdit() {
    onOverridesChange?.(draft)
    setEditing(false)
  }

  function resetFit() {
    setDraft(prev => {
      const next: SizeGuideOverrides = JSON.parse(JSON.stringify(prev))
      if (next[garment]) delete next[garment][resolvedFit]
      return next
    })
  }

  return (
    <div className="p-4 md:p-6 max-w-[1100px]">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-grace-mist border border-grace-border flex items-center justify-center text-grace-ink">
            <Ruler size={18} />
          </div>
          <div>
            <h1 className="text-xl font-black text-grace-ink uppercase tracking-tight">Size Guide</h1>
            <p className="text-grace-stone text-sm">All measurements in inches. Garment measured flat.</p>
          </div>
        </div>

        {editable && !editing && (
          <button onClick={startEdit} className="btn-secondary flex items-center gap-2 shrink-0">
            <Pencil size={13} /> Edit Size Guide
          </button>
        )}
        {editing && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={cancelEdit} className="btn-secondary flex items-center gap-1.5">
              <X size={13} /> Cancel
            </button>
            <button onClick={saveEdit} className="btn-primary flex items-center gap-1.5">
              <Check size={13} /> Save
            </button>
          </div>
        )}
      </div>

      {/* Garment selector */}
      {allowGarmentSwitch && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {getAllGarmentTypes().map(g => (
            <button
              key={g}
              onClick={() => { setGarment(g); setFit(undefined); setEditing(false) }}
              disabled={editing}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-colors disabled:opacity-40 ${
                g === garment
                  ? 'bg-grace-ink text-white'
                  : 'bg-grace-mist text-grace-stone hover:text-grace-ink border border-grace-border'
              }`}
            >
              {GARMENT_LABELS[g]}
            </button>
          ))}
        </div>
      )}

      {/* Fit selector */}
      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-grace-stone mr-1">Fit</span>
        {guide.availableFits.map(f => (
          <button
            key={f}
            onClick={() => { setFit(f); setEditing(false) }}
            disabled={editing}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-colors disabled:opacity-40 ${
              f === resolvedFit
                ? 'bg-grace-ink text-white'
                : 'bg-white text-grace-stone hover:text-grace-ink border border-grace-border'
            }`}
          >
            {fitLabel(f)}
            {f === guide.defaultFit && <span className="ml-1 opacity-50">·</span>}
          </button>
        ))}
        {guide.edited && !editing && (
          <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest text-grace-red">Edited</span>
        )}
      </div>

      {/* Measurement table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-grace-border">
              <th className="text-left font-semibold text-grace-stone text-[11px] uppercase tracking-wider px-4 py-3 sticky left-0 bg-white">
                Measurement
              </th>
              {guide.sizes.map(size => (
                <th key={size} className="font-bold text-grace-ink text-xs px-3 py-3 text-center min-w-[64px]">
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guide.rows.map(row => (
              <tr key={row.key} className="border-b border-grace-border last:border-0 hover:bg-grace-mist/50">
                <td className="px-4 py-3 sticky left-0 bg-white">
                  <div className="font-semibold text-grace-ink text-[13px]">{row.label}</div>
                  <div className="text-[10px] text-grace-stone leading-tight mt-0.5 max-w-[200px]">{row.hint}</div>
                </td>
                {guide.sizes.map(size => (
                  <td key={size} className="px-3 py-3 text-center">
                    {editing ? (
                      <input
                        type="number"
                        step="0.125"
                        defaultValue={row.values[size]}
                        onChange={e => setDraftValue(row.key, size, e.target.value)}
                        className="w-16 text-center text-[13px] rounded-lg border border-grace-border px-1.5 py-1 focus:outline-none focus:border-grace-ink"
                      />
                    ) : (
                      <span className="text-grace-ink text-[13px] tabular-nums">{formatInches(row.values[size])}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footnotes */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <p className="text-[11px] text-grace-stone leading-relaxed max-w-xl">
          Half-measurements (Chest, Waist, Thigh, Leg Opening) are taken with the garment laid flat —
          double for the full body circumference. Sizes graded XS–3XL from the {fitLabel(resolvedFit)} fit block.
        </p>
        {editing && (
          <button
            onClick={resetFit}
            className="text-[11px] font-semibold text-grace-stone hover:text-grace-ink flex items-center gap-1 shrink-0"
          >
            <RotateCcw size={12} /> Reset {fitLabel(resolvedFit)}
          </button>
        )}
      </div>
    </div>
  )
}
