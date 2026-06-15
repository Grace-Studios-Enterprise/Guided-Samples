import type { BottomFitLibrary, BottomFitBlock, GraphicPlacement, SupplierExportMapping, BottomMeasurementSet } from '../../types'
import { buildBottomSizeChart, BOTTOM_FIT_TRANSFORMS } from '../../transformRules'
import { BENCHMARKS } from '../../benchmarks'

const b = BENCHMARKS.sweatpants

// Sweatpants benchmark is TAPERED (Stüssy Fleece Pant — relaxed upper, ribbed ankle cuff).
// The Tapered fit is the benchmark. Relaxed and other variants are generated relative to it.

const taperedBaseM: BottomMeasurementSet = {
  consumer: {
    waist:       b.publishedMeasurementsAtM.waist,       // 15.5
    frontRise:   b.publishedMeasurementsAtM.frontRise,   // 12.5
    inseam:      b.publishedMeasurementsAtM.inseam,      // 28.5
    thigh:       b.publishedMeasurementsAtM.thigh,       // 13.5
    legOpening:  b.publishedMeasurementsAtM.legOpening,  // 5.5 — ribbed cuff
  },
  technical: {
    backRise:        15.5,  // total rise - front rise + 3" for back curve
    kneeWidth:        9.5,  // half-knee, measured at knee point
    bottomOpening:    5.5,  // matches cuff opening
    cuffOpening:      5.5,
    waistbandHeight:  2.0,  // exposed waistband height
    seat:            16.0,  // half-seat at 8" below waist
  },
}

// For sweatpants, Tapered IS the benchmark.
// Relaxed, Wide Leg, Vintage, Standard, Open Bottom derived relative to it.
function buildFromTapered(offsets: { waist?: number; thigh?: number; knee?: number; leg?: number; frontRise?: number; inseam?: number }): BottomMeasurementSet {
  return {
    consumer: {
      waist:      taperedBaseM.consumer.waist      + (offsets.waist     ?? 0),
      frontRise:  taperedBaseM.consumer.frontRise  + (offsets.frontRise ?? 0),
      inseam:     taperedBaseM.consumer.inseam     + (offsets.inseam    ?? 0),
      thigh:      taperedBaseM.consumer.thigh      + (offsets.thigh     ?? 0),
      legOpening: taperedBaseM.consumer.legOpening + (offsets.leg       ?? 0),
    },
    technical: {
      backRise:        taperedBaseM.technical.backRise         + (offsets.frontRise ?? 0),
      kneeWidth:       taperedBaseM.technical.kneeWidth        + (offsets.knee      ?? 0),
      bottomOpening:   taperedBaseM.consumer.legOpening        + (offsets.leg       ?? 0),
      cuffOpening:     (taperedBaseM.technical.cuffOpening ?? 5.5) + (offsets.leg ?? 0),
      waistbandHeight: taperedBaseM.technical.waistbandHeight,
      seat:            taperedBaseM.technical.seat!            + (offsets.thigh     ?? 0) * 0.75,
    },
  }
}

const FITS_DEF: Record<BottomFitBlock['fitVariant'], BottomMeasurementSet | null> = {
  standard:     buildFromTapered({ thigh: -0.5, knee: -0.25, leg: 1.0 }),  // less thigh, more open leg (not cuffed)
  relaxed:      buildFromTapered({ thigh: 0.5, knee: 1.5, leg: 2.0 }),     // more thigh ease, open-hem version
  tapered:      taperedBaseM,                                               // benchmark
  wide_leg:     buildFromTapered({ thigh: 3.0, knee: 3.5, leg: 4.5 }),
  vintage:      buildFromTapered({ waist: 0.5, thigh: 1.0, knee: 1.0, leg: 2.5, frontRise: 0.5 }),
  open_bottom:  buildFromTapered({ thigh: 0.5, knee: 1.5, leg: 3.0 }),
  // Not applicable for sweatpants — omit
  oversized:       null,
  vintage_oversized: null,
  cropped:         null,
}

const RULES: Partial<Record<BottomFitBlock['fitVariant'], string[]>> = {
  standard:    ['Standard: -0.5" thigh from Tapered, leg opens +1" (no ribbed cuff; open hem).'],
  relaxed:     ['Relaxed: +0.5" thigh, leg opens +2" from Tapered. Treated as open-hem fleece.'],
  wide_leg:    ['Wide Leg: +3" thigh, +4.5" leg opening from Tapered. Ribbed cuff removed for wide opening.'],
  vintage:     ['Vintage: +0.5" waist, +1" thigh, +2.5" leg, +0.5" rise from Tapered. Higher waist, roomier — heritage athletic proportions.'],
  open_bottom: ['Open Bottom: +0.5" thigh from Tapered, leg opening +3" — elasticated hem removed to create clean open-bottom silhouette.'],
}

const PLACEMENTS: GraphicPlacement[] = [
  { location: 'left_hip',  xOffsetInches: -4.0, yOffsetInches: 3.0, maxWidthInches: 4, maxHeightInches: 4, widthGradePerSize: 0, notes: 'Left hip logo/badge. Common on fleece bottoms.' },
  { location: 'right_hip', xOffsetInches:  4.0, yOffsetInches: 3.0, maxWidthInches: 4, maxHeightInches: 4, widthGradePerSize: 0, notes: 'Right hip alternative placement.' },
  { location: 'left_sleeve', xOffsetInches: 0, yOffsetInches: 6.0, maxWidthInches: 3, maxHeightInches: 10, widthGradePerSize: 0, notes: 'Left leg side seam stripe or text. Measured from waistband.' },
]

const EXPORT_MAPPINGS: SupplierExportMapping[] = [
  { field: 'consumer.waist',      supplierLabel: 'Waist (1/2)',          exportVisible: true, displayMultiplier: 1, unit: 'in', notes: 'Relaxed flat measurement' },
  { field: 'consumer.frontRise',  supplierLabel: 'Front Rise',           exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.inseam',     supplierLabel: 'Inseam',               exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.thigh',      supplierLabel: 'Thigh (1/2)',          exportVisible: true, displayMultiplier: 1, unit: 'in', notes: '1" below crotch seam' },
  { field: 'consumer.legOpening', supplierLabel: 'Leg Opening (1/2)',    exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.backRise',  supplierLabel: 'Back Rise',            exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.kneeWidth', supplierLabel: 'Knee Width (1/2)',     exportVisible: true, displayMultiplier: 1, unit: 'in', notes: '14" from crotch seam' },
  { field: 'technical.cuffOpening',supplierLabel: 'Cuff Opening (1/2)', exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.waistbandHeight', supplierLabel: 'Waistband Height', exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.seat',      supplierLabel: 'Seat (1/2)',           exportVisible: true, displayMultiplier: 1, unit: 'in', notes: '8" below waistband' },
]

export const sweatpants: BottomFitLibrary = {
  garmentType:   'sweatpants',
  defaultFit:    'tapered',
  availableFits: ['standard', 'relaxed', 'tapered', 'wide_leg', 'vintage', 'open_bottom'],
  fits: Object.fromEntries(
    Object.entries(FITS_DEF)
      .filter(([, baseM]) => baseM !== null)
      .map(([variant, baseM]) => [
        variant,
        {
          garmentType: 'sweatpants' as const,
          fitVariant:  variant as BottomFitBlock['fitVariant'],
          isBenchmark: variant === 'tapered',
          benchmark:   variant === 'tapered' ? b.source : undefined,
          transformationRules: variant === 'tapered' ? undefined : RULES[variant as BottomFitBlock['fitVariant']],
          sizeChart:   buildBottomSizeChart(baseM as BottomMeasurementSet),
          graphicPlacements: PLACEMENTS,
          supplierExportMappings: EXPORT_MAPPINGS,
          internalNotes: variant === 'tapered'
            ? [`Benchmark: ${b.source.brand} ${b.source.productName} (${b.source.sku}). ${b.classificationRationale}`]
            : (RULES[variant as BottomFitBlock['fitVariant']] ?? []),
        } satisfies BottomFitBlock,
      ])
  ) as BottomFitLibrary['fits'],
}
