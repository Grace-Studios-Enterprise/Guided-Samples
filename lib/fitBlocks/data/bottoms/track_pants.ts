import type { BottomFitLibrary, BottomFitBlock, GraphicPlacement, SupplierExportMapping, BottomMeasurementSet } from '../../types'
import { buildBottomSizeChart } from '../../transformRules'
import { BENCHMARKS } from '../../benchmarks'

const b = BENCHMARKS.track_pants

// Track pants benchmark is STANDARD (Stüssy Nylon Track Pant — clean athletic straight leg).

const standardBaseM: BottomMeasurementSet = {
  consumer: {
    waist:       b.publishedMeasurementsAtM.waist,       // 15
    frontRise:   b.publishedMeasurementsAtM.frontRise,   // 12
    inseam:      b.publishedMeasurementsAtM.inseam,      // 29
    thigh:       b.publishedMeasurementsAtM.thigh,       // 12.5
    legOpening:  b.publishedMeasurementsAtM.legOpening,  // 8
  },
  technical: {
    backRise:        15.0,
    kneeWidth:        9.5,
    bottomOpening:    8.0,
    waistbandHeight:  1.5,
    seat:            15.5,
  },
}

function buildFromStandard(offsets: { waist?: number; thigh?: number; knee?: number; leg?: number; frontRise?: number; inseam?: number }): BottomMeasurementSet {
  return {
    consumer: {
      waist:      standardBaseM.consumer.waist      + (offsets.waist     ?? 0),
      frontRise:  standardBaseM.consumer.frontRise  + (offsets.frontRise ?? 0),
      inseam:     standardBaseM.consumer.inseam     + (offsets.inseam    ?? 0),
      thigh:      standardBaseM.consumer.thigh      + (offsets.thigh     ?? 0),
      legOpening: standardBaseM.consumer.legOpening + (offsets.leg       ?? 0),
    },
    technical: {
      backRise:        standardBaseM.technical.backRise         + (offsets.frontRise ?? 0),
      kneeWidth:       standardBaseM.technical.kneeWidth        + (offsets.knee      ?? 0),
      bottomOpening:   standardBaseM.consumer.legOpening        + (offsets.leg       ?? 0),
      waistbandHeight: standardBaseM.technical.waistbandHeight,
      seat:            standardBaseM.technical.seat!            + (offsets.thigh     ?? 0) * 0.75,
    },
  }
}

const FITS_DEF: [BottomFitBlock['fitVariant'], BottomMeasurementSet, boolean, string[]][] = [
  ['standard',    standardBaseM, true,  []],
  ['relaxed',     buildFromStandard({ thigh: 1.0, knee: 0.75, leg: 0.75 }), false, ['Relaxed +1" thigh, proportional knee and leg opening from Standard.']],
  ['wide_leg',    buildFromStandard({ thigh: 3.0, knee: 3.5, leg: 4.0 }),   false, ['Wide Leg +3" thigh, +4" leg opening from Standard.']],
  ['vintage',     buildFromStandard({ waist: 0.5, thigh: 1.0, knee: 0.75, leg: 0.75, frontRise: 0.5 }), false, ['Vintage: higher rise +0.5", +1" thigh, roomier leg. Heritage athletic proportions.']],
  ['tapered',     buildFromStandard({ knee: -0.5, leg: -1.0 }),              false, ['Tapered: same thigh as Standard, knee -0.5", leg opening -1".']],
  ['open_bottom', buildFromStandard({ thigh: 0.5, knee: 1.0, leg: 2.0 }),   false, ['Open Bottom: leg opening +2" from Standard; leg equals or exceeds knee for clean open hem.']],
]

const PLACEMENTS: GraphicPlacement[] = [
  { location: 'left_hip',  xOffsetInches: -4.0, yOffsetInches: 2.5, maxWidthInches: 4, maxHeightInches: 4, widthGradePerSize: 0, notes: 'Hip logo placement.' },
  { location: 'right_hip', xOffsetInches:  4.0, yOffsetInches: 2.5, maxWidthInches: 4, maxHeightInches: 4, widthGradePerSize: 0, notes: 'Right hip alternative.' },
  { location: 'left_sleeve', xOffsetInches: 0, yOffsetInches: 4.0, maxWidthInches: 3, maxHeightInches: 12, widthGradePerSize: 0, notes: 'Left leg side stripe or text. Snap-button opening often used here.' },
]

const EXPORT_MAPPINGS: SupplierExportMapping[] = [
  { field: 'consumer.waist',      supplierLabel: 'Waist (1/2)',       exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.frontRise',  supplierLabel: 'Front Rise',        exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.inseam',     supplierLabel: 'Inseam',            exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.thigh',      supplierLabel: 'Thigh (1/2)',       exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.legOpening', supplierLabel: 'Leg Opening (1/2)', exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.backRise',  supplierLabel: 'Back Rise',         exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.kneeWidth', supplierLabel: 'Knee Width (1/2)',  exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.waistbandHeight', supplierLabel: 'Waistband Height', exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.seat',      supplierLabel: 'Seat (1/2)',        exportVisible: true, displayMultiplier: 1, unit: 'in' },
]

export const trackPants: BottomFitLibrary = {
  garmentType:   'track_pants',
  defaultFit:    'standard',
  availableFits: ['standard', 'relaxed', 'wide_leg', 'vintage', 'tapered', 'open_bottom'],
  fits: Object.fromEntries(
    FITS_DEF.map(([variant, baseM, isBenchmark, rules]) => [
      variant,
      {
        garmentType: 'track_pants' as const,
        fitVariant: variant,
        isBenchmark,
        benchmark: isBenchmark ? b.source : undefined,
        transformationRules: isBenchmark ? undefined : rules,
        sizeChart: buildBottomSizeChart(baseM),
        graphicPlacements: PLACEMENTS,
        supplierExportMappings: EXPORT_MAPPINGS,
        internalNotes: isBenchmark
          ? [`Benchmark: ${b.source.brand} ${b.source.productName} (${b.source.sku}).`]
          : rules,
      } satisfies BottomFitBlock,
    ])
  ) as BottomFitLibrary['fits'],
}
