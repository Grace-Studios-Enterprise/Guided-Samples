import type { BottomFitLibrary, BottomFitBlock, GraphicPlacement, SupplierExportMapping, BottomMeasurementSet } from '../../types'
import { buildBottomSizeChart } from '../../transformRules'
import { BENCHMARKS } from '../../benchmarks'

const b = BENCHMARKS.shorts

// ASSUMPTIONS DOCUMENTED (see benchmarks.ts shorts entry):
// 1. Inseam 8.5" at M — mid-thigh streetwear length.
// 2. Leg opening slightly wider than thigh (9.0") for mobility.
// 3. Waist/rise/thigh proportions from Track Pant benchmark.
// 4. Inseam grades +0.25" per size (vs +0.375" for pants).

const standardBaseM: BottomMeasurementSet = {
  consumer: {
    waist:       b.publishedMeasurementsAtM.waist,       // 15
    frontRise:   b.publishedMeasurementsAtM.frontRise,   // 12
    inseam:      b.publishedMeasurementsAtM.inseam,      // 8.5
    thigh:       b.publishedMeasurementsAtM.thigh,       // 12.5
    legOpening:  b.publishedMeasurementsAtM.legOpening,  // 8.5
  },
  technical: {
    backRise:        15.0,
    kneeWidth:        0,   // no knee measurement for shorts — leg ends above knee
    bottomOpening:    8.5,
    waistbandHeight:  1.5,
    seat:            15.5,
  },
}

function buildFromStandard(offsets: { waist?: number; thigh?: number; leg?: number; frontRise?: number; inseam?: number }): BottomMeasurementSet {
  return {
    consumer: {
      waist:      standardBaseM.consumer.waist      + (offsets.waist     ?? 0),
      frontRise:  standardBaseM.consumer.frontRise  + (offsets.frontRise ?? 0),
      inseam:     standardBaseM.consumer.inseam     + (offsets.inseam    ?? 0),
      thigh:      standardBaseM.consumer.thigh      + (offsets.thigh     ?? 0),
      legOpening: standardBaseM.consumer.legOpening + (offsets.leg       ?? 0),
    },
    technical: {
      backRise:        standardBaseM.technical.backRise        + (offsets.frontRise ?? 0),
      kneeWidth:       0,
      bottomOpening:   standardBaseM.consumer.legOpening       + (offsets.leg       ?? 0),
      waistbandHeight: standardBaseM.technical.waistbandHeight,
      seat:            standardBaseM.technical.seat!           + (offsets.thigh     ?? 0) * 0.75,
    },
  }
}

const FITS_DEF: [BottomFitBlock['fitVariant'], BottomMeasurementSet, boolean, string[]][] = [
  ['standard', standardBaseM, true, []],
  ['relaxed',  buildFromStandard({ thigh: 1.0, leg: 1.0 }), false, ['Relaxed: +1" thigh, +1" leg opening from Standard.']],
  ['wide_leg', buildFromStandard({ thigh: 3.0, leg: 4.0 }), false, ['Wide Leg: +3" thigh, +4" leg opening from Standard. Creates a wide-leg short silhouette.']],
  ['vintage',  buildFromStandard({ waist: 0.5, thigh: 0.75, leg: 0.75, frontRise: 0.25, inseam: 0.5 }), false,
    ['Vintage: +0.5" waist, +0.75" thigh, +0.5" inseam (slightly longer). Higher rise and roomier upper.']],
]

const PLACEMENTS: GraphicPlacement[] = [
  { location: 'left_hip',  xOffsetInches: -4.0, yOffsetInches: 2.5, maxWidthInches: 4, maxHeightInches: 4, widthGradePerSize: 0, notes: 'Primary: left hip badge/logo.' },
  { location: 'right_hip', xOffsetInches:  4.0, yOffsetInches: 2.5, maxWidthInches: 4, maxHeightInches: 4, widthGradePerSize: 0, notes: 'Right hip alternative.' },
]

const EXPORT_MAPPINGS: SupplierExportMapping[] = [
  { field: 'consumer.waist',      supplierLabel: 'Waist (1/2)',       exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.frontRise',  supplierLabel: 'Front Rise',        exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.inseam',     supplierLabel: 'Inseam',            exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.thigh',      supplierLabel: 'Thigh (1/2)',       exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.legOpening', supplierLabel: 'Leg Opening (1/2)', exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.backRise',  supplierLabel: 'Back Rise',         exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.waistbandHeight', supplierLabel: 'Waistband Height', exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.seat',      supplierLabel: 'Seat (1/2)',        exportVisible: true, displayMultiplier: 1, unit: 'in' },
]

export const shorts: BottomFitLibrary = {
  garmentType:   'shorts',
  defaultFit:    'standard',
  availableFits: ['standard', 'relaxed', 'wide_leg', 'vintage'],
  fits: Object.fromEntries(
    FITS_DEF.map(([variant, baseM, isBenchmark, rules]) => [
      variant,
      {
        garmentType: 'shorts' as const,
        fitVariant: variant,
        isBenchmark,
        benchmark: isBenchmark ? b.source : undefined,
        transformationRules: isBenchmark ? undefined : rules,
        sizeChart: buildBottomSizeChart(baseM),
        graphicPlacements: PLACEMENTS,
        supplierExportMappings: EXPORT_MAPPINGS,
        internalNotes: isBenchmark
          ? [`Benchmark: derived from Track Pant. Assumptions: ${b.source.notes}`]
          : rules,
      } satisfies BottomFitBlock,
    ])
  ) as BottomFitLibrary['fits'],
}
