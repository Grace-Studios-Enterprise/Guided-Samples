import type { TopFitLibrary, TopFitBlock, GraphicPlacement, SupplierExportMapping, TopMeasurementSet } from '../../types'
import { buildTopSizeChart, TOP_FIT_TRANSFORMS } from '../../transformRules'
import { BENCHMARKS } from '../../benchmarks'

const b = BENCHMARKS.short_sleeve_tee

// ── Base at size M (Relaxed — benchmark) ──────────────────────────────────────

const relaxedBaseM: TopMeasurementSet = {
  consumer: {
    chest:         b.publishedMeasurementsAtM.chest,         // 20
    frontLength:   b.publishedMeasurementsAtM.frontLength,   // 28
    shoulderWidth: 18.5,  // derived: dropped shoulder at size M
    sleeveLength:  b.publishedMeasurementsAtM.sleeveLength,  // 8.5
  },
  technical: {
    armhole:       10.0,  // straight armhole measurement, dropped set
    bottomOpening: 20.0,  // similar width to chest — boxy hem
    neckOpening:   7.875, // interior rib neckline width
    sleeveOpening: 6.0,   // half-sleeve opening at cuff
    backLength:    28.5,  // back longer than front due to curve
  },
}

// ── Graphic placements ─────────────────────────────────────────────────────────

const PLACEMENTS: GraphicPlacement[] = [
  {
    location:         'center_chest',
    xOffsetInches:    0,
    yOffsetInches:    4.5,
    maxWidthInches:   11,
    maxHeightInches:  11,
    widthGradePerSize: 0.5,
    notes: 'Primary front placement. Top of graphic 4.5" from HPS.',
  },
  {
    location:         'left_chest',
    xOffsetInches:   -4.5,
    yOffsetInches:    4.5,
    maxWidthInches:   3.5,
    maxHeightInches:  3.5,
    widthGradePerSize: 0,
    notes: 'Small logo or badge placement. Left of center.',
  },
  {
    location:         'upper_back',
    xOffsetInches:    0,
    yOffsetInches:    4.0,
    maxWidthInches:   13,
    maxHeightInches:  5,
    widthGradePerSize: 0.5,
    notes: 'Back yoke / name print zone.',
  },
  {
    location:         'center_back',
    xOffsetInches:    0,
    yOffsetInches:    8.0,
    maxWidthInches:   13,
    maxHeightInches:  13,
    widthGradePerSize: 0.5,
    notes: 'Large back graphic zone.',
  },
]

// ── Supplier export mappings ───────────────────────────────────────────────────

const EXPORT_MAPPINGS: SupplierExportMapping[] = [
  { field: 'consumer.chest',         supplierLabel: 'Chest (1/2)',        exportVisible: true,  displayMultiplier: 1, unit: 'in', notes: 'Measure flat across chest, 1" below armhole' },
  { field: 'consumer.frontLength',   supplierLabel: 'Front Length (HPS)', exportVisible: true,  displayMultiplier: 1, unit: 'in', notes: 'HPS to hem, straight' },
  { field: 'consumer.shoulderWidth', supplierLabel: 'Shoulder Width',     exportVisible: true,  displayMultiplier: 1, unit: 'in', notes: 'Point to point across back shoulder seam' },
  { field: 'consumer.sleeveLength',  supplierLabel: 'Sleeve Length',      exportVisible: true,  displayMultiplier: 1, unit: 'in', notes: 'From shoulder seam to cuff edge' },
  { field: 'technical.armhole',      supplierLabel: 'Armhole (straight)', exportVisible: true,  displayMultiplier: 1, unit: 'in', notes: 'Straight measurement across armhole opening' },
  { field: 'technical.bottomOpening',supplierLabel: 'Bottom Opening (1/2)',exportVisible: true,  displayMultiplier: 1, unit: 'in' },
  { field: 'technical.neckOpening',  supplierLabel: 'Neck Opening',       exportVisible: true,  displayMultiplier: 1, unit: 'in', notes: 'Inside edge to inside edge across rib' },
  { field: 'technical.sleeveOpening',supplierLabel: 'Sleeve Opening (1/2)',exportVisible: true,  displayMultiplier: 1, unit: 'in' },
  { field: 'technical.backLength',   supplierLabel: 'Back Length (HPS)',  exportVisible: true,  displayMultiplier: 1, unit: 'in' },
]

// ── Fit variant builder ────────────────────────────────────────────────────────

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
      neckOpening:    relaxedBaseM.technical.neckOpening    + (t.neckOpening    ?? 0),
      sleeveOpening:  relaxedBaseM.technical.sleeveOpening  + (t.sleeveOpening  ?? 0),
      backLength:     relaxedBaseM.technical.backLength!     + (typeof (t as Record<string, unknown>).backLength === 'number' ? (t as Record<string, unknown>).backLength as number : 0),
    },
  }
  return {
    garmentType:     'short_sleeve_tee',
    fitVariant:      fitVariant as TopFitBlock['fitVariant'],
    isBenchmark,
    benchmark:       isBenchmark ? b.source : undefined,
    transformationRules: isBenchmark ? undefined : t._rules,
    sizeChart:       buildTopSizeChart(adjustedBaseM),
    graphicPlacements: PLACEMENTS,
    supplierExportMappings: EXPORT_MAPPINGS,
    internalNotes:   isBenchmark
      ? [`Benchmark: ${b.source.brand} ${b.source.productName} (${b.source.sku}). Classification: ${b.graceClassification}. ${b.classificationRationale}`]
      : t._rules,
  }
}

// ── Library export ─────────────────────────────────────────────────────────────

export const shortSleeveTee: TopFitLibrary = {
  garmentType:   'short_sleeve_tee',
  defaultFit:    'relaxed',
  availableFits: ['standard', 'relaxed', 'oversized', 'vintage_oversized', 'cropped'],
  fits: {
    standard:         buildVariant('standard'),
    relaxed:          buildVariant('relaxed', true),
    oversized:        buildVariant('oversized'),
    vintage_oversized: buildVariant('vintage_oversized'),
    cropped:          buildVariant('cropped'),
  },
}
