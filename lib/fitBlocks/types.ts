// GRACE Fit Block System — Type Definitions
// All garment measurements are in inches, stored as garment (flat) measurements.
// Chest, waist, thigh, leg opening = half-measurements (measure flat, multiply by 2 for full).
// Length, shoulder, sleeve, rise, inseam = full measurements.

export type GarmentType =
  | 'short_sleeve_tee'
  | 'long_sleeve_tee'
  | 'crewneck'
  | 'hoodie'
  | 'zip_hoodie'
  | 'track_jacket'
  | 'windbreaker'
  | 'sweatpants'
  | 'track_pants'
  | 'shorts'

export type FitVariant =
  | 'standard'
  | 'relaxed'
  | 'oversized'
  | 'vintage_oversized'
  | 'cropped'
  | 'wide_leg'
  | 'vintage'
  | 'tapered'
  | 'open_bottom'

export const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const
export type SizeKey = typeof ALL_SIZES[number]

// ── Consumer-facing measurement schemas ────────────────────────────────────────

/** What users see for tops. All values in inches. */
export interface TopConsumerMeasurements {
  /** Half-chest (garment flat). Display as full to consumer (×2). */
  chest: number
  /** Front body length from HPS (high point shoulder) to hem. */
  frontLength: number
  /** Shoulder width, point to point across back. */
  shoulderWidth: number
  /** Sleeve length from shoulder seam to cuff end. */
  sleeveLength: number
}

/** What users see for bottoms. All values in inches. */
export interface BottomConsumerMeasurements {
  /** Half-waist (garment flat, at natural waistband). */
  waist: number
  /** Front rise: crotch seam to top of waistband, front. */
  frontRise: number
  /** Inseam: crotch seam to hem. */
  inseam: number
  /** Half-leg opening at hem. */
  legOpening: number
  /** Half-thigh, measured 1 inch below crotch seam. */
  thigh: number
}

// ── Hidden technical measurement schemas ───────────────────────────────────────

/** Supplier-only specs for tops. Not shown to end users. */
export interface TopTechnicalMeasurements {
  /** Half-armhole, straight measurement across armhole opening. */
  armhole: number
  /** Half-bottom opening (sweep), measured flat at hem. */
  bottomOpening: number
  /** Front neck width: inside edge to inside edge at neckline. */
  neckOpening: number
  /** Half-sleeve opening at cuff. */
  sleeveOpening: number
  // Hood-specific (null for non-hooded garments)
  hoodHeight?: number
  hoodOpening?: number
  hoodDepth?: number
  // Rib/cuff specifics
  cuffLength?: number
  cuffOpening?: number
  // Back length (for silhouette verification)
  backLength?: number
}

/** Supplier-only specs for bottoms. */
export interface BottomTechnicalMeasurements {
  /** Back rise: crotch seam to top of waistband, back. */
  backRise: number
  /** Half-knee width, measured at knee point (typically 14" from crotch). */
  kneeWidth: number
  /** Half-bottom opening at hem (same as legOpening for open styles). */
  bottomOpening: number
  /** Half-cuff opening for elasticated/ribbed hem styles. */
  cuffOpening?: number
  /** Waistband height/width. */
  waistbandHeight: number
  /** Half-seat, measured 8" below waistband. */
  seat?: number
}

// ── Composite per-size measurement set ────────────────────────────────────────

export interface TopMeasurementSet {
  consumer: TopConsumerMeasurements
  technical: TopTechnicalMeasurements
}

export interface BottomMeasurementSet {
  consumer: BottomConsumerMeasurements
  technical: BottomTechnicalMeasurements
}

export type TopSizeChart = Record<SizeKey, TopMeasurementSet>
export type BottomSizeChart = Record<SizeKey, BottomMeasurementSet>

// ── Graphic placement ──────────────────────────────────────────────────────────

export type PlacementLocation =
  | 'center_chest'
  | 'left_chest'
  | 'upper_back'
  | 'lower_back'
  | 'left_sleeve'
  | 'right_sleeve'
  | 'left_hip'
  | 'right_hip'
  | 'center_back'

export interface GraphicPlacement {
  location: PlacementLocation
  /** Horizontal offset in inches from center axis. Negative = left. */
  xOffsetInches: number
  /** Vertical offset in inches from top of collar (tops) or waistband (bottoms). */
  yOffsetInches: number
  /** Maximum print/embroidery width at size M. */
  maxWidthInches: number
  /** Maximum print/embroidery height at size M. */
  maxHeightInches: number
  /** Grades with size — how much max width changes per size step. */
  widthGradePerSize: number
  notes: string
}

// ── Supplier export mapping ────────────────────────────────────────────────────

export interface SupplierExportMapping {
  /** Internal field path, e.g. 'consumer.chest' or 'technical.armhole'. */
  field: string
  /** Label printed on supplier spec sheet. */
  supplierLabel: string
  /** Whether this field is visible on supplier export. */
  exportVisible: boolean
  /** Multiplier before export (e.g. 2 to convert half-chest to full-chest). */
  displayMultiplier?: number
  /** Unit to show on export. */
  unit: 'in' | 'cm'
  notes?: string
}

// ── Benchmark metadata ─────────────────────────────────────────────────────────

export type DataSourceType = 'stussy_published' | 'derived' | 'estimated'

export interface BenchmarkSource {
  brand: string
  productName: string
  sku: string
  url: string
  /** How the data was obtained. */
  dataSource: DataSourceType
  /** Verbatim or paraphrased fit description from the product page. */
  fitDescription: string
  modelInfo?: string
  notes: string
}

// ── Fit Block ──────────────────────────────────────────────────────────────────

export interface TopFitBlock {
  garmentType: GarmentType
  fitVariant: FitVariant
  /** Whether this is the primary benchmark or a derived variant. */
  isBenchmark: boolean
  benchmark?: BenchmarkSource
  /** If derived: rationale for how measurements differ from benchmark. */
  transformationRules?: string[]
  sizeChart: TopSizeChart
  graphicPlacements: GraphicPlacement[]
  supplierExportMappings: SupplierExportMapping[]
  /** Free-text notes visible to GRACE internal team only. */
  internalNotes: string[]
}

export interface BottomFitBlock {
  garmentType: GarmentType
  fitVariant: FitVariant
  isBenchmark: boolean
  benchmark?: BenchmarkSource
  transformationRules?: string[]
  sizeChart: BottomSizeChart
  graphicPlacements: GraphicPlacement[]
  supplierExportMappings: SupplierExportMapping[]
  internalNotes: string[]
}

// ── Garment fit library ────────────────────────────────────────────────────────

export interface TopFitLibrary {
  garmentType: GarmentType
  defaultFit: FitVariant
  availableFits: FitVariant[]
  fits: Partial<Record<FitVariant, TopFitBlock>>
}

export interface BottomFitLibrary {
  garmentType: GarmentType
  defaultFit: FitVariant
  availableFits: FitVariant[]
  fits: Partial<Record<FitVariant, BottomFitBlock>>
}

export type FitLibrary = TopFitLibrary | BottomFitLibrary
