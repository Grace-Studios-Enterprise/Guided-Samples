import type { TopFitLibrary, TopFitBlock, GraphicPlacement, SupplierExportMapping, TopMeasurementSet } from '../../types'
import { buildTopSizeChart, TOP_FIT_TRANSFORMS } from '../../transformRules'
import { BENCHMARKS } from '../../benchmarks'

const b = BENCHMARKS.zip_hoodie

// VERIFIED published consumer measurements at size M (Beach Roots Zip Hoodie 1975198).
// Published guide (XS–L) grades chest, front length, sleeve, and shoulder at +1.0"/step.
// The grade override below makes buildTopSizeChart reproduce the published guide exactly
// (shoulder & sleeve grade at 1.0 here vs the default 0.5), and extrapolates XL–3XL.
const ZIP_HOODIE_GRADE_OVERRIDE = { shoulderWidth: 1.0, sleeveLength: 1.0 }

const relaxedBaseM: TopMeasurementSet = {
  consumer: {
    chest:         b.publishedMeasurementsAtM.chest,         // 23.5 (verified, half-chest)
    frontLength:   b.publishedMeasurementsAtM.frontLength,   // 28   (verified)
    shoulderWidth: b.publishedMeasurementsAtM.shoulderWidth, // 22   (verified, point-to-point)
    sleeveLength:  b.publishedMeasurementsAtM.sleeveLength,  // 25.3 (verified)
  },
  technical: {
    // Technical (supplier-facing) values derived from the verified consumer block.
    armhole:       11.0,  // wider verified chest → larger armhole
    bottomOpening: 23.0,  // ribbed hem pulls in slightly under chest
    neckOpening:   8.5,
    sleeveOpening: 5.25,
    cuffLength:    2.0,
    cuffOpening:   5.25,
    backLength:    28.5,  // front length 28 + 0.5 back curve
    hoodHeight:    b.publishedMeasurementsAtM.hoodHeight,   // 13 (derived)
    hoodOpening:   9.5,
    hoodDepth:     7.0,
  },
}

const PLACEMENTS: GraphicPlacement[] = [
  {
    location: 'left_chest',
    xOffsetInches: -4.0,
    yOffsetInches: 4.5,
    maxWidthInches: 3.5,
    maxHeightInches: 3.5,
    widthGradePerSize: 0,
    notes: 'Left chest is preferred primary placement on zip hoodies — center chest is split by zip.',
  },
  {
    location: 'upper_back',
    xOffsetInches: 0,
    yOffsetInches: 4.5,
    maxWidthInches: 14,
    maxHeightInches: 5,
    widthGradePerSize: 0.5,
    notes: 'Back yoke — preferred large print zone for zip hoodies.',
  },
  {
    location: 'center_back',
    xOffsetInches: 0,
    yOffsetInches: 9.0,
    maxWidthInches: 14,
    maxHeightInches: 12,
    widthGradePerSize: 0.5,
    notes: 'Large back graphic.',
  },
  {
    location: 'left_sleeve',
    xOffsetInches: 0,
    yOffsetInches: 4.0,
    maxWidthInches: 3,
    maxHeightInches: 8,
    widthGradePerSize: 0,
    notes: 'Sleeve stripe or vertical text.',
  },
]

const EXPORT_MAPPINGS: SupplierExportMapping[] = [
  { field: 'consumer.chest',         supplierLabel: 'Chest (1/2)',          exportVisible: true, displayMultiplier: 1, unit: 'in', notes: 'Measured with zip closed' },
  { field: 'consumer.frontLength',   supplierLabel: 'Front Length (HPS)',   exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.shoulderWidth', supplierLabel: 'Shoulder Width',       exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'consumer.sleeveLength',  supplierLabel: 'Sleeve Length',        exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.armhole',      supplierLabel: 'Armhole (straight)',   exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.bottomOpening',supplierLabel: 'Bottom Opening (1/2)', exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.neckOpening',  supplierLabel: 'Neck Opening',         exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.cuffOpening',  supplierLabel: 'Cuff Opening (1/2)',   exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.cuffLength',   supplierLabel: 'Cuff Length',          exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.hoodHeight',   supplierLabel: 'Hood Height',          exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.hoodOpening',  supplierLabel: 'Hood Opening (1/2)',   exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.hoodDepth',    supplierLabel: 'Hood Depth',           exportVisible: true, displayMultiplier: 1, unit: 'in' },
  { field: 'technical.backLength',   supplierLabel: 'Back Length (HPS)',    exportVisible: true, displayMultiplier: 1, unit: 'in' },
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
      hoodHeight:     relaxedBaseM.technical.hoodHeight,
      hoodOpening:    relaxedBaseM.technical.hoodOpening,
      hoodDepth:      relaxedBaseM.technical.hoodDepth,
    },
  }
  return {
    garmentType: 'zip_hoodie',
    fitVariant:  fitVariant as TopFitBlock['fitVariant'],
    isBenchmark,
    benchmark:   isBenchmark ? b.source : undefined,
    transformationRules: isBenchmark ? undefined : t._rules,
    sizeChart:   buildTopSizeChart(adjustedBaseM, ZIP_HOODIE_GRADE_OVERRIDE),
    graphicPlacements: PLACEMENTS,
    supplierExportMappings: EXPORT_MAPPINGS,
    internalNotes: isBenchmark
      ? [`Benchmark: ${b.source.brand} ${b.source.productName} (${b.source.sku}).`]
      : t._rules,
  }
}

export const zipHoodie: TopFitLibrary = {
  garmentType:   'zip_hoodie',
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
