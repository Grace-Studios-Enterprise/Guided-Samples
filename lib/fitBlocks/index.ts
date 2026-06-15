// GRACE Fit Block System — Central Registry
// All garment fit libraries are registered here.
// Import from this file; do not import individual garment files directly.

export * from './types'
export { BENCHMARKS } from './benchmarks'
export { buildTopSizeChart, buildBottomSizeChart, TOP_GRADE, BOTTOM_GRADE, TOP_FIT_TRANSFORMS, BOTTOM_FIT_TRANSFORMS } from './transformRules'

import { shortSleeveTee } from './data/tops/short_sleeve_tee'
import { longSleeveTee }   from './data/tops/long_sleeve_tee'
import { crewneck }        from './data/tops/crewneck'
import { hoodie }          from './data/tops/hoodie'
import { zipHoodie }       from './data/tops/zip_hoodie'
import { trackJacket }     from './data/tops/track_jacket'
import { windbreaker }     from './data/tops/windbreaker'
import { sweatpants }      from './data/bottoms/sweatpants'
import { trackPants }      from './data/bottoms/track_pants'
import { shorts }          from './data/bottoms/shorts'

import type { GarmentType, FitVariant, TopFitLibrary, BottomFitLibrary, TopFitBlock, BottomFitBlock } from './types'

// ── Registry ───────────────────────────────────────────────────────────────────

export const FIT_BLOCK_REGISTRY: Record<GarmentType, TopFitLibrary | BottomFitLibrary> = {
  short_sleeve_tee: shortSleeveTee,
  long_sleeve_tee:  longSleeveTee,
  crewneck:         crewneck,
  hoodie:           hoodie,
  zip_hoodie:       zipHoodie,
  track_jacket:     trackJacket,
  windbreaker:      windbreaker,
  sweatpants:       sweatpants,
  track_pants:      trackPants,
  shorts:           shorts,
}

// ── Query helpers ──────────────────────────────────────────────────────────────

/** Get the full fit library for a garment type. */
export function getFitLibrary(garmentType: GarmentType): TopFitLibrary | BottomFitLibrary {
  return FIT_BLOCK_REGISTRY[garmentType]
}

/** Get a specific fit block. Falls back to default fit if the requested variant isn't available. */
export function getFitBlock(garmentType: GarmentType, fitVariant?: FitVariant): TopFitBlock | BottomFitBlock | null {
  const library = FIT_BLOCK_REGISTRY[garmentType]
  const variant = fitVariant ?? library.defaultFit
  return (library.fits as Record<string, TopFitBlock | BottomFitBlock>)[variant] ?? null
}

/** Get available fit variants for a garment. */
export function getAvailableFits(garmentType: GarmentType): FitVariant[] {
  return FIT_BLOCK_REGISTRY[garmentType].availableFits
}

/** Get default fit variant for a garment. */
export function getDefaultFit(garmentType: GarmentType): FitVariant {
  return FIT_BLOCK_REGISTRY[garmentType].defaultFit
}

/** List all registered garment types. */
export function getAllGarmentTypes(): GarmentType[] {
  return Object.keys(FIT_BLOCK_REGISTRY) as GarmentType[]
}

/**
 * Map a legacy garment type string (as used in Phase2Garment / existing tech pack) to
 * the canonical GarmentType key used by the fit block system.
 */
export const GARMENT_TYPE_MAP: Record<string, GarmentType> = {
  'T-Shirt':            'short_sleeve_tee',
  'Hoodie':             'hoodie',
  'Zip Hoodie':         'zip_hoodie',
  'Crewneck':           'crewneck',
  'Track Jacket':       'track_jacket',
  'Track Pants':        'track_pants',
  'Windbreaker':        'windbreaker',
  'Basketball Jersey':  'short_sleeve_tee',  // closest analog until dedicated block
  'Basketball Shorts':  'shorts',
  'Sweatpants':         'sweatpants',
  // Direct keys
  short_sleeve_tee: 'short_sleeve_tee',
  long_sleeve_tee:  'long_sleeve_tee',
  crewneck:         'crewneck',
  hoodie:           'hoodie',
  zip_hoodie:       'zip_hoodie',
  track_jacket:     'track_jacket',
  windbreaker:      'windbreaker',
  sweatpants:       'sweatpants',
  track_pants:      'track_pants',
  shorts:           'shorts',
}

export function resolveGarmentType(raw: string): GarmentType | null {
  return GARMENT_TYPE_MAP[raw] ?? null
}

/** Resolve and return the fit block for a legacy garment type string. */
export function getFitBlockForGarment(rawGarmentType: string, fitVariant?: FitVariant): TopFitBlock | BottomFitBlock | null {
  const canonical = resolveGarmentType(rawGarmentType)
  if (!canonical) return null
  return getFitBlock(canonical, fitVariant)
}
