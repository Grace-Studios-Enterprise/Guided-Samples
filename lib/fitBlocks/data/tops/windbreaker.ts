import type { TopFitLibrary, TopFitBlock, GraphicPlacement, SupplierExportMapping, TopMeasurementSet } from '../../types'
import { buildTopSizeChart } from '../../transformRules'
import { BENCHMARKS } from '../../benchmarks'

const b = BENCHMARKS.windbreaker

// Windbreaker derived from Track Jacket benchmark + 0.5" chest for shell-layer ease.
// Standard is the benchmark fit. Other fits generated relative to standard.

function buildFromStandard(chestOffset: number, shoulderOffset: number, frontLengthOffset = 0): TopMeasurementSet {
  return {
    consumer: {
      chest:         b.publishedMeasurementsAtM.chest + chestOffset,           // 20.5 + offset
      frontLength:   b.publishedMeasurementsAtM.frontLength + frontLengthOffset, // 28.5 + offset
      shoulderWidth: 18.25 + shoulderOffset,
      sleeveLength:  b.publishedMeasurementsAtM.sleeveLength, // 25.5
    },
    technical: {
      armhole:        10.0 + chestOffset * 0.25,
      bottomOpening:  20.5 + chestOffset,
      neckOpening:     7.875,
      sleeveOpening:   5.5,
      cuffLength:      1.5,
      cuffOpening:     5.5,
      backLength:     29.0 + frontLengthOffset,
    },
  }
}

const PLACEMENTS: GraphicPlacement[] = [
  { location: 'left_chest',  xOffsetInches: -4.5, yOffsetInches: 4.5, maxWidthInches: 3.5, maxHeightInches: 3.5, widthGradePerSize: 0, notes: 'Primary: left chest. Center is split by zip.' },
  { location: 'upper_back',  xOffsetInches: 0, yOffsetInches: 4.5, maxWidthInches: 13, maxHeightInches: 5, widthGradePerSize: 0.5, notes: 'Back yoke.' },
  { location: 'center_back', xOffsetInches: 0, yOffsetInches: 9.0, maxWidthInches: 13, maxHeightInches: 11, widthGradePerSize: 0.5, notes: 'Large back print.' },
  { location: 'left_sleeve', xOffsetInches: 0, yOffsetInches: 5.0, maxWidthInches: 3, maxHeightInches: 8, widthGradePerSize: 0, notes: 'Sleeve stripe or text.' },
]

const EXPORT_MAPPINGS: SupplierExportMapping[] = [
  { field: 'consumer.chest',         supplierLabel: 'Chest (1/2)',          exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.frontLength',   supplierLabel: 'Front Length (HPS)',   exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.shoulderWidth', supplierLabel: 'Shoulder Width',       exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.sleeveLength',  supplierLabel: 'Sleeve Length',        exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.armhole',      supplierLabel: 'Armhole (straight)',   exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.bottomOpening',supplierLabel: 'Bottom Opening (1/2)', exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.neckOpening',  supplierLabel: 'Neck Opening',         exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.cuffOpening',  supplierLabel: 'Cuff Opening (1/2)',   exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.cuffLength',   supplierLabel: 'Cuff Length',          exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.backLength',   supplierLabel: 'Back Length (HPS)',    exportVisible: true, displayMultiplier: 1, unit: 'in' },
]

const FITS_DEF: [TopFitBlock['fitVariant'], number, number, number, string[]][] = [
  ['standard',          0,   0,    0,    []],
  ['relaxed',           1.0, 0.5,  0,    ['Relaxed +1" chest, +0.5" shoulder from Standard.']],
  ['oversized',         3.0, 1.5,  1.0,  ['Oversized +3" chest, +1.5" shoulder, +1" length from Standard.']],
  ['vintage_oversized', 4.0, 2.0, -0.5,  ['Vintage Oversized: +4" chest, +2" shoulder; body -0.5" for boxy proportion.']],
  ['cropped',           0,   0,   -3.5,  ['Cropped: width preserved from Standard, body length -3.5".']],
]

export const windbreaker: TopFitLibrary = {
  garmentType:   'windbreaker',
  defaultFit:    'standard',
  availableFits: ['standard', 'relaxed', 'oversized', 'vintage_oversized', 'cropped'],
  fits: Object.fromEntries(
    FITS_DEF.map(([variant, chest, shoulder, length, rules]) => [
      variant,
      {
        garmentType: 'windbreaker' as const,
        fitVariant:  variant,
        isBenchmark: variant === 'standard',
        benchmark:   variant === 'standard' ? b.source : undefined,
        transformationRules: variant === 'standard' ? undefined : rules,
        sizeChart:   buildTopSizeChart(buildFromStandard(chest, shoulder, length)),
        graphicPlacements: PLACEMENTS,
        supplierExportMappings: EXPORT_MAPPINGS,
        internalNotes: variant === 'standard'
          ? [`Benchmark: derived from Track Jacket (${b.source.sku}) + 0.5" chest. ${b.source.notes}`]
          : rules,
      } satisfies TopFitBlock,
    ])
  ) as TopFitLibrary['fits'],
}
