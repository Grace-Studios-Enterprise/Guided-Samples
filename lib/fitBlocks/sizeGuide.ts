// GRACE Size Guide — Consumer-facing projection of the fit block system.
//
// This module is the ONLY surface the user-facing Size Guide UI should read from.
// It deliberately exposes consumer measurements only. Hidden technical (supplier)
// measurements never pass through here — they are reachable solely via
// getTechPackMeasurements(), which is consumed by tech pack / technical drawing
// generation, not by any consumer screen.

import { getFitBlock, getFitLibrary, resolveGarmentType } from './index'
import type {
  GarmentType, FitVariant, SizeKey,
  TopFitBlock, BottomFitBlock,
  TopMeasurementSet, BottomMeasurementSet,
} from './types'
import { ALL_SIZES } from './types'

export type GarmentCategory = 'top' | 'bottom'

/** A single consumer measurement row across all sizes. */
export interface SizeGuideRow {
  /** Stable key, e.g. 'chest' or 'inseam'. */
  key: string
  /** Human label shown to the user, e.g. 'Chest'. */
  label: string
  /** Short helper describing how it's measured. */
  hint: string
  /** Whether this value is a half (flat) measurement doubled for the body. */
  isHalf: boolean
  /** Per-size values in inches. */
  values: Record<SizeKey, number>
}

export interface ConsumerSizeGuide {
  garmentType: GarmentType
  category: GarmentCategory
  fit: FitVariant
  availableFits: FitVariant[]
  defaultFit: FitVariant
  sizes: readonly SizeKey[]
  rows: SizeGuideRow[]
  /** True if the guide reflects user overrides rather than the raw fit block. */
  edited: boolean
}

/**
 * Per-garment consumer override store.
 * Shape: { [garmentType]: { [fit]: { [measurementKey]: { [size]: value } } } }
 * Only consumer measurements can be overridden; technical specs are not editable here.
 */
export type SizeGuideOverrides = Record<string, Record<string, Record<string, Partial<Record<SizeKey, number>>>>>

// ── Consumer field definitions (display order, labels, hints) ───────────────────

const TOP_FIELDS: { key: keyof TopMeasurementSet['consumer']; label: string; hint: string; isHalf: boolean }[] = [
  { key: 'chest',         label: 'Chest',          hint: 'Measured flat across the chest, 1" below the armhole', isHalf: true },
  { key: 'frontLength',   label: 'Front Length',   hint: 'High point of shoulder straight down to the hem',      isHalf: false },
  { key: 'shoulderWidth', label: 'Shoulder Width', hint: 'Seam to seam across the back of the shoulders',        isHalf: false },
  { key: 'sleeveLength',  label: 'Sleeve Length',  hint: 'Shoulder seam to the end of the cuff',                 isHalf: false },
]

const BOTTOM_FIELDS: { key: keyof BottomMeasurementSet['consumer']; label: string; hint: string; isHalf: boolean }[] = [
  { key: 'waist',      label: 'Waist',       hint: 'Measured flat across the waistband',          isHalf: true },
  { key: 'frontRise',  label: 'Front Rise',  hint: 'Crotch seam to the top of the waistband',     isHalf: false },
  { key: 'inseam',     label: 'Inseam',      hint: 'Crotch seam straight down to the hem',        isHalf: false },
  { key: 'thigh',      label: 'Thigh',       hint: 'Measured flat 1" below the crotch seam',      isHalf: true },
  { key: 'legOpening', label: 'Leg Opening', hint: 'Measured flat across the hem opening',        isHalf: true },
]

// ── Category detection ─────────────────────────────────────────────────────────

const BOTTOM_TYPES: GarmentType[] = ['sweatpants', 'track_pants', 'shorts']

export function categoryOf(garmentType: GarmentType): GarmentCategory {
  return BOTTOM_TYPES.includes(garmentType) ? 'bottom' : 'top'
}

// ── Consumer guide builder ─────────────────────────────────────────────────────

/**
 * Build the consumer-facing size guide for a garment + fit, applying any user
 * overrides. Returns consumer measurements only — never technical specs.
 */
export function getConsumerSizeGuide(
  garmentType: GarmentType,
  fit?: FitVariant,
  overrides?: SizeGuideOverrides,
): ConsumerSizeGuide | null {
  const library = getFitLibrary(garmentType)
  const resolvedFit = fit ?? library.defaultFit
  const block = getFitBlock(garmentType, resolvedFit)
  if (!block) return null

  const category = categoryOf(garmentType)
  const fields = category === 'top' ? TOP_FIELDS : BOTTOM_FIELDS
  const ov = overrides?.[garmentType]?.[resolvedFit]
  let edited = false

  const rows: SizeGuideRow[] = fields.map(field => {
    const values = {} as Record<SizeKey, number>
    for (const size of ALL_SIZES) {
      const set = (block.sizeChart as Record<SizeKey, TopMeasurementSet | BottomMeasurementSet>)[size]
      const consumer = set.consumer as unknown as Record<string, number>
      const base = consumer[field.key as string]
      const override = ov?.[field.key as string]?.[size]
      if (override != null && override !== base) edited = true
      values[size] = override != null ? override : base
    }
    return {
      key: field.key as string,
      label: field.label,
      hint: field.hint,
      isHalf: field.isHalf,
      values,
    }
  })

  return {
    garmentType,
    category,
    fit: resolvedFit,
    availableFits: library.availableFits,
    defaultFit: library.defaultFit,
    sizes: ALL_SIZES,
    rows,
    edited,
  }
}

/** Same as getConsumerSizeGuide but accepts a legacy garment-type string. */
export function getConsumerSizeGuideForGarment(
  rawGarmentType: string,
  fit?: FitVariant,
  overrides?: SizeGuideOverrides,
): ConsumerSizeGuide | null {
  const canonical = resolveGarmentType(rawGarmentType)
  if (!canonical) return null
  return getConsumerSizeGuide(canonical, fit, overrides)
}

// ── Tech-pack projection (consumer + technical) ────────────────────────────────

export interface TechPackMeasurements {
  garmentType: GarmentType
  fit: FitVariant
  block: TopFitBlock | BottomFitBlock
  /** Full per-size measurement sets including hidden technical specs. */
  sizeChart: TopFitBlock['sizeChart'] | BottomFitBlock['sizeChart']
}

/**
 * Full measurement projection for tech pack / technical drawing generation.
 * Includes hidden technical measurements and applies consumer overrides on top of
 * the consumer block so the spec sheet reflects any edits the user made.
 * NOT for consumer screens.
 */
export function getTechPackMeasurements(
  garmentType: GarmentType,
  fit?: FitVariant,
  overrides?: SizeGuideOverrides,
): TechPackMeasurements | null {
  const block = getFitBlock(garmentType, fit)
  if (!block) return null
  const resolvedFit = fit ?? getFitLibrary(garmentType).defaultFit
  const ov = overrides?.[garmentType]?.[resolvedFit]

  if (!ov) {
    return { garmentType, fit: resolvedFit, block, sizeChart: block.sizeChart }
  }

  // Apply consumer overrides without mutating the registry block.
  const merged = structuredCloneSafe(block.sizeChart) as Record<SizeKey, TopMeasurementSet | BottomMeasurementSet>
  for (const size of ALL_SIZES) {
    const consumer = merged[size].consumer as unknown as Record<string, number>
    for (const [key, perSize] of Object.entries(ov)) {
      const v = perSize?.[size]
      if (v != null && key in consumer) consumer[key] = v
    }
  }
  return {
    garmentType,
    fit: resolvedFit,
    block,
    sizeChart: merged as TechPackMeasurements['sizeChart'],
  }
}

function structuredCloneSafe<T>(obj: T): T {
  if (typeof structuredClone === 'function') return structuredClone(obj)
  return JSON.parse(JSON.stringify(obj))
}

// ── Display helpers ────────────────────────────────────────────────────────────

const FIT_LABELS: Record<FitVariant, string> = {
  standard:          'Standard',
  relaxed:           'Relaxed',
  oversized:         'Oversized',
  vintage_oversized: 'Vintage Oversized',
  cropped:           'Cropped',
  wide_leg:          'Wide Leg',
  vintage:           'Vintage',
  tapered:           'Tapered',
  open_bottom:       'Open Bottom',
}

export function fitLabel(fit: FitVariant): string {
  return FIT_LABELS[fit] ?? fit
}

/** Format inches to a clean fraction-friendly string, e.g. 25.25 -> "25¼". */
export function formatInches(value: number): string {
  const whole = Math.floor(value)
  const frac = value - whole
  const eighths = Math.round(frac * 8)
  const FRACTIONS: Record<number, string> = { 0: '', 1: '⅛', 2: '¼', 3: '⅜', 4: '½', 5: '⅝', 6: '¾', 7: '⅞', 8: '' }
  if (eighths === 8) return `${whole + 1}`
  if (eighths === 0) return `${whole}`
  return whole === 0 ? FRACTIONS[eighths] : `${whole}${FRACTIONS[eighths]}`
}
