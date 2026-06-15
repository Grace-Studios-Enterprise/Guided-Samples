import type { TopFitLibrary, TopFitBlock, GraphicPlacement, SupplierExportMapping, TopMeasurementSet } from '../../types'
import { buildTopSizeChart, TOP_FIT_TRANSFORMS } from '../../transformRules'
import { BENCHMARKS } from '../../benchmarks'

const b = BENCHMARKS.long_sleeve_tee

const relaxedBaseM: TopMeasurementSet = {
  consumer: {
    chest:         b.publishedMeasurementsAtM.chest,        // 20
    frontLength:   b.publishedMeasurementsAtM.frontLength,  // 28
    shoulderWidth: 18.5,
    sleeveLength:  b.publishedMeasurementsAtM.sleeveLength, // 25
  },
  technical: {
    armhole:       10.0,
    bottomOpening: 20.0,
    neckOpening:   7.875,
    sleeveOpening: 5.5,   // ribbed cuff narrows sleeve opening vs SS
    cuffLength:    1.5,   // ribbed cuff height
    cuffOpening:   5.5,
    backLength:    28.5,
  },
}

const PLACEMENTS: GraphicPlacement[] = [
  { location: 'center_chest', xOffsetInches: 0, yOffsetInches: 4.5, maxWidthInches: 11, maxHeightInches: 11, widthGradePerSize: 0.5, notes: 'Primary front placement.' },
  { location: 'left_chest',   xOffsetInches: -4.5, yOffsetInches: 4.5, maxWidthInches: 3.5, maxHeightInches: 3.5, widthGradePerSize: 0, notes: 'Badge/logo zone.' },
  { location: 'upper_back',   xOffsetInches: 0, yOffsetInches: 4.0, maxWidthInches: 13, maxHeightInches: 5, widthGradePerSize: 0.5, notes: 'Back yoke print.' },
  { location: 'center_back',  xOffsetInches: 0, yOffsetInches: 8.0, maxWidthInches: 13, maxHeightInches: 13, widthGradePerSize: 0.5, notes: 'Large back graphic.' },
  { location: 'left_sleeve',  xOffsetInches: 0, yOffsetInches: 4.0, maxWidthInches: 3, maxHeightInches: 8, widthGradePerSize: 0, notes: 'Sleeve band or vertical text. Measured from shoulder seam down.' },
]

const EXPORT_MAPPINGS: SupplierExportMapping[] = [
  { field: 'consumer.chest',         supplierLabel: 'Chest (1/2)',         exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.frontLength',   supplierLabel: 'Front Length (HPS)',  exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.shoulderWidth', supplierLabel: 'Shoulder Width',      exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.sleeveLength',  supplierLabel: 'Sleeve Length',       exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.armhole',      supplierLabel: 'Armhole (straight)',  exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.bottomOpening',supplierLabel: 'Bottom Opening (1/2)',exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.neckOpening',  supplierLabel: 'Neck Opening',        exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.cuffOpening',  supplierLabel: 'Cuff Opening (1/2)', exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.cuffLength',   supplierLabel: 'Cuff Length',         exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.backLength',   supplierLabel: 'Back Length (HPS)',   exportVisible: true, displayMultiplier: 1, unit: 'in' },
]

function buildVariant(fitVariant: keyof typeof TOP_FIT_TRANSFORMS, isBenchmark = false): TopFitBlock {
  const t = TOP_FIT_TRANSFORMS[fitVariant]
  const adjustedBaseM: TopMeasurementSet = {
    consumer: {
      chest:         relaxedBaseM.consumer.chest         + (t.chest         ?? 0),
      frontLength:   relaxedBaseM.consumer.frontLength   + (t.frontLength   ?? 0),
      shoulderWidth: relaxedBaseM.consumer.shoulderWidth + (t.shoulderWidth ?? 0),
      sleeveLength:  relaxedBaseM.consumer.sleeveLength  + (t.sleeveLength  ?? 0),
    },
    technical: {
      armhole:        relaxedBaseM.technical.armhole        + (t.armhole        ?? 0),
      bottomOpening:  relaxedBaseM.technical.bottomOpening  + (t.bottomOpening  ?? 0),
      neckOpening:    relaxedBaseM.technical.neckOpening,
      sleeveOpening:  relaxedBaseM.technical.sleeveOpening,
      cuffLength:     relaxedBaseM.technical.cuffLength,
      cuffOpening:    relaxedBaseM.technical.cuffOpening,
      backLength:     relaxedBaseM.technical.backLength!,
    },
  }
  return {
    garmentType: 'long_sleeve_tee',
    fitVariant:  fitVariant as TopFitBlock['fitVariant'],
    isBenchmark,
    benchmark:   isBenchmark ? b.source : undefined,
    transformationRules: isBenchmark ? undefined : t._rules,
    sizeChart:   buildTopSizeChart(adjustedBaseM),
    graphicPlacements: PLACEMENTS,
    supplierExportMappings: EXPORT_MAPPINGS,
    internalNotes: isBenchmark
      ? [`Benchmark: ${b.source.brand} ${b.source.productName} (${b.source.sku}).`]
      : t._rules,
  }
}

export const longSleeveTee: TopFitLibrary = {
  garmentType:   'long_sleeve_tee',
  defaultFit:    'relaxed',
  availableFits: ['standard', 'relaxed', 'oversized', 'vintage_oversized', 'cropped'],
  fits: {
    standard:          buildVariant('standard'),
    relaxed:           buildVariant('relaxed', true),
    oversized:         buildVariant('oversized'),
    vintage_oversized: buildVariant('vintage_oversized'),
    cropped:           buildVariant('cropped'),
  },
}
