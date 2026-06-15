// GRACE Fit Block — Transformation Rules
// Documents every rule used when generating a fit variant from a benchmark.
// Each rule set is applied additively to the benchmark measurements at size M,
// then re-graded across all sizes using the standard grade tables.

import type {
  TopConsumerMeasurements,
  TopTechnicalMeasurements,
  BottomConsumerMeasurements,
  BottomTechnicalMeasurements,
  TopMeasurementSet,
  BottomMeasurementSet,
  SizeKey,
  TopSizeChart,
  BottomSizeChart,
} from './types'

// ── Grade tables ───────────────────────────────────────────────────────────────
// Standard streetwear grade increments per size step (in inches).
// One "step" = one size (XS→S, S→M, M→L, …).

export const TOP_GRADE: Record<keyof TopConsumerMeasurements, number> & { [k: string]: number } = {
  chest:         1.0,   // half-chest grades +1" per step
  frontLength:   0.75,  // body length
  shoulderWidth: 0.5,
  sleeveLength:  0.5,
}

export const TOP_TECHNICAL_GRADE: Record<keyof TopTechnicalMeasurements, number> = {
  armhole:       0.5,
  bottomOpening: 1.0,
  neckOpening:   0.125,
  sleeveOpening: 0.25,
  hoodHeight:    0.25,
  hoodOpening:   0.25,
  hoodDepth:     0.125,
  cuffLength:    0,     // cuff length doesn't grade
  cuffOpening:   0.125,
  backLength:    0.75,
}

export const BOTTOM_GRADE: Record<keyof BottomConsumerMeasurements, number> = {
  waist:       1.0,
  frontRise:   0.25,
  inseam:      0.375,
  legOpening:  0.25,
  thigh:       0.5,
}

export const BOTTOM_TECHNICAL_GRADE: Record<keyof BottomTechnicalMeasurements, number> = {
  backRise:        0.25,
  kneeWidth:       0.375,
  bottomOpening:   0.25,
  cuffOpening:     0.125,
  waistbandHeight: 0,    // waistband height doesn't grade
  seat:            0.5,
}

// Size index relative to M (M = 0, L = +1, XL = +2, 2XL = +3, 3XL = +4, S = -1, XS = -2)
export const SIZE_STEPS: Record<SizeKey, number> = {
  XS:  -2,
  S:   -1,
  M:    0,
  L:    1,
  XL:   2,
  '2XL': 3,
  '3XL': 4,
}

// ── Grade application helpers ──────────────────────────────────────────────────

function gradeTop(base: TopMeasurementSet, steps: number): TopMeasurementSet {
  return {
    consumer: {
      chest:         round(base.consumer.chest         + steps * TOP_GRADE.chest),
      frontLength:   round(base.consumer.frontLength   + steps * TOP_GRADE.frontLength),
      shoulderWidth: round(base.consumer.shoulderWidth + steps * TOP_GRADE.shoulderWidth),
      sleeveLength:  round(base.consumer.sleeveLength  + steps * TOP_GRADE.sleeveLength),
    },
    technical: {
      armhole:        round(base.technical.armhole        + steps * TOP_TECHNICAL_GRADE.armhole),
      bottomOpening:  round(base.technical.bottomOpening  + steps * TOP_TECHNICAL_GRADE.bottomOpening),
      neckOpening:    round(base.technical.neckOpening    + steps * TOP_TECHNICAL_GRADE.neckOpening),
      sleeveOpening:  round(base.technical.sleeveOpening  + steps * TOP_TECHNICAL_GRADE.sleeveOpening),
      ...(base.technical.hoodHeight    != null && { hoodHeight:    round(base.technical.hoodHeight    + steps * TOP_TECHNICAL_GRADE.hoodHeight) }),
      ...(base.technical.hoodOpening   != null && { hoodOpening:   round(base.technical.hoodOpening   + steps * TOP_TECHNICAL_GRADE.hoodOpening) }),
      ...(base.technical.hoodDepth     != null && { hoodDepth:     round(base.technical.hoodDepth     + steps * TOP_TECHNICAL_GRADE.hoodDepth) }),
      ...(base.technical.cuffLength    != null && { cuffLength:    base.technical.cuffLength }),
      ...(base.technical.cuffOpening   != null && { cuffOpening:   round(base.technical.cuffOpening   + steps * TOP_TECHNICAL_GRADE.cuffOpening) }),
      ...(base.technical.backLength    != null && { backLength:    round(base.technical.backLength    + steps * TOP_TECHNICAL_GRADE.backLength) }),
    },
  }
}

function gradeBottom(base: BottomMeasurementSet, steps: number): BottomMeasurementSet {
  return {
    consumer: {
      waist:       round(base.consumer.waist       + steps * BOTTOM_GRADE.waist),
      frontRise:   round(base.consumer.frontRise   + steps * BOTTOM_GRADE.frontRise),
      inseam:      round(base.consumer.inseam      + steps * BOTTOM_GRADE.inseam),
      legOpening:  round(base.consumer.legOpening  + steps * BOTTOM_GRADE.legOpening),
      thigh:       round(base.consumer.thigh       + steps * BOTTOM_GRADE.thigh),
    },
    technical: {
      backRise:        round(base.technical.backRise        + steps * BOTTOM_TECHNICAL_GRADE.backRise),
      kneeWidth:       round(base.technical.kneeWidth       + steps * BOTTOM_TECHNICAL_GRADE.kneeWidth),
      bottomOpening:   round(base.technical.bottomOpening   + steps * BOTTOM_TECHNICAL_GRADE.bottomOpening),
      waistbandHeight: base.technical.waistbandHeight,
      ...(base.technical.cuffOpening != null && { cuffOpening: round(base.technical.cuffOpening + steps * BOTTOM_TECHNICAL_GRADE.cuffOpening) }),
      ...(base.technical.seat        != null && { seat:        round(base.technical.seat        + steps * BOTTOM_TECHNICAL_GRADE.seat) }),
    },
  }
}

function round(n: number): number {
  return Math.round(n * 8) / 8 // nearest 1/8"
}

/** Build a full 7-size chart from a single base measurement set at size M. */
export function buildTopSizeChart(baseAtM: TopMeasurementSet): TopSizeChart {
  const chart = {} as TopSizeChart
  for (const [size, steps] of Object.entries(SIZE_STEPS)) {
    chart[size as SizeKey] = gradeTop(baseAtM, steps)
  }
  return chart
}

export function buildBottomSizeChart(baseAtM: BottomMeasurementSet): BottomSizeChart {
  const chart = {} as BottomSizeChart
  for (const [size, steps] of Object.entries(SIZE_STEPS)) {
    chart[size as SizeKey] = gradeBottom(baseAtM, steps)
  }
  return chart
}

// ── Fit variant transformation offsets ────────────────────────────────────────
// Applied to the BENCHMARK base-M measurements to produce a new fit variant.
// All values in inches. Positive = larger, negative = smaller.

/**
 * Top fit transformations.
 * Applied relative to the RELAXED benchmark (most Stüssy tops are relaxed).
 */
export const TOP_FIT_TRANSFORMS: Record<string, Partial<TopConsumerMeasurements & TopTechnicalMeasurements> & { _rules: string[] }> = {
  standard: {
    chest:         -1.0,
    shoulderWidth: -0.5,
    frontLength:    0,
    sleeveLength:   0,
    armhole:       -0.25,
    bottomOpening: -1.0,
    _rules: [
      'Standard sits -1" chest vs Relaxed: removes ease without going slim.',
      'Shoulder narrows -0.5" to reduce the dropped-shoulder look.',
      'Length unchanged; standard silhouette is same length as relaxed.',
      'Armhole lifts slightly (-0.25") for cleaner sleeve set.',
    ],
  },
  relaxed: {
    // Benchmark — no offset applied
    chest:         0,
    shoulderWidth: 0,
    frontLength:   0,
    sleeveLength:  0,
    _rules: [
      'Relaxed is the benchmark fit derived directly from source product.',
      'No transformation applied.',
    ],
  },
  oversized: {
    chest:          2.0,
    shoulderWidth:  1.0,
    frontLength:    1.0,
    sleeveLength:   0.5,
    armhole:        0.5,
    bottomOpening:  2.0,
    _rules: [
      'Oversized adds +2" chest from Relaxed for significant ease.',
      'Shoulder drops +1" (wider drop, natural on oversized silhouette).',
      'Body length +1" to maintain proportional hem drop.',
      'Sleeve +0.5" to match widened armhole and longer body.',
    ],
  },
  vintage_oversized: {
    chest:          3.0,
    shoulderWidth:  1.5,
    frontLength:   -0.5,  // shorter body despite wider chest — boxier
    sleeveLength:   0.25,
    armhole:        0.75,
    bottomOpening:  3.0,
    _rules: [
      'Vintage Oversized adds +3" chest for extreme width.',
      'Shoulder extends +1.5" — exaggerated drop shoulder.',
      'Body length -0.5" vs Oversized: shorter body emphasizes boxy silhouette.',
      'This contradicts a naive "bigger = longer" rule and is intentional.',
      'Mimics 90s/00s athletic heritage proportions.',
    ],
  },
  cropped: {
    chest:          0,
    shoulderWidth:  0,
    frontLength:   -3.5,
    sleeveLength:   0,
    bottomOpening:  0,
    _rules: [
      'Cropped preserves exact width from Relaxed — width is not changed.',
      'Body length -3.5" from Relaxed (M base 28" → 24.5").',
      'Sleeve unchanged; crop affects body length only.',
    ],
  },
}

/**
 * Bottom fit transformations.
 * Applied relative to the RELAXED benchmark (Stüssy Fleece Pant baseline).
 */
export const BOTTOM_FIT_TRANSFORMS: Record<string, Partial<BottomConsumerMeasurements & BottomTechnicalMeasurements> & { _rules: string[] }> = {
  standard: {
    waist:       0,
    thigh:      -0.5,
    kneeWidth:  -0.5,
    legOpening: -0.5,
    frontRise:   0,
    inseam:      0,
    _rules: [
      'Standard removes -0.5" thigh ease vs Relaxed.',
      'Knee and leg opening taper proportionally.',
      'Rise and inseam unchanged.',
    ],
  },
  relaxed: {
    _rules: [
      'Relaxed is the benchmark fit derived from Stüssy Fleece Pant.',
    ],
  },
  wide_leg: {
    thigh:        3.0,
    kneeWidth:    3.5,
    legOpening:   4.0,
    frontRise:    0.25,
    _rules: [
      'Wide Leg increases thigh +3" from Relaxed for dramatic silhouette.',
      'Knee widens +3.5" and leg opening +4" — leg opening exceeds knee to create flare.',
      'Front rise +0.25" to account for added fabric weight pulling down.',
    ],
  },
  vintage: {
    waist:        0.5,
    thigh:        1.0,
    kneeWidth:    0.75,
    legOpening:   0.75,
    frontRise:    0.5,
    backRise:     0.5,
    _rules: [
      'Vintage adds +0.5" waist — heritage cuts had more ease at waist.',
      'Thigh +1" for a roomier upper leg.',
      'Rise +0.5" front and back — vintage athletic bottoms sit higher.',
      'Leg opening +0.75" — not wide but not tapered; relaxed straight leg.',
    ],
  },
  tapered: {
    thigh:       0,
    kneeWidth:  -0.5,
    legOpening: -1.0,
    _rules: [
      'Tapered holds same thigh as Relaxed but tapers through knee (-0.5") to leg opening (-1").',
      'Creates a clean silhouette without reducing upper-leg comfort.',
    ],
  },
  open_bottom: {
    thigh:       0.5,
    kneeWidth:   0.5,
    legOpening:  1.5,
    _rules: [
      'Open Bottom matches Relaxed at thigh but removes all tapering below knee.',
      'Leg opening widens +1.5" vs Relaxed so that it equals or exceeds knee width.',
      'Intended for athletic pants that slip over footwear.',
    ],
  },
}
