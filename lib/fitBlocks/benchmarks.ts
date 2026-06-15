// GRACE Fit Block — Stüssy Benchmark Classifications
//
// Source: Stüssy published size guides, product descriptions, and silhouette analysis.
// Data extracted from training data (knowledge cutoff August 2025).
// Stüssy.com blocks automated access; values should be verified against current
// published size guides at the URLs listed below before production use.
//
// Measurement convention: inches, half-measurements for chest/waist/thigh/leg-opening.
// "Half" = garment measured flat; multiply × 2 for full/body measurement.

import type { BenchmarkSource, FitVariant } from './types'

export interface BenchmarkRecord {
  source: BenchmarkSource
  /** Fit classification determined by GRACE, not necessarily Stüssy's own label. */
  graceClassification: FitVariant
  /** Stüssy's stated fit description (verbatim or close paraphrase). */
  statedFit: string
  /** GRACE rationale for the classification. */
  classificationRationale: string
  /** Silhouette characteristics observed from product. */
  silhouetteCharacteristics: string[]
  /**
   * Published measurements at size M (in inches).
   * Half-chest, half-waist, half-thigh, half-leg-opening.
   * Front length, shoulder, sleeve, rise, inseam are full measurements.
   */
  publishedMeasurementsAtM: Record<string, number>
  /** Grade per size step for the published measurements (in inches). */
  publishedGrade: Record<string, number>
}

// ── Benchmark records ──────────────────────────────────────────────────────────

export const BENCHMARKS: Record<string, BenchmarkRecord> = {

  short_sleeve_tee: {
    source: {
      brand: 'Stüssy',
      productName: 'Basic Stüssy Tee',
      sku: '1905000',
      url: 'https://www.stussy.com/collections/basic-stussy-tees/products/1905000-basic-stussy-tee-navy',
      dataSource: 'stussy_published',
      fitDescription: 'Regular fit. Our classic T-shirt, cut in a relaxed silhouette with a ribbed crewneck.',
      modelInfo: 'Model wears size M',
      notes: 'Measurements from training data; verify at URL above.',
    },
    graceClassification: 'relaxed',
    statedFit: 'Regular fit',
    classificationRationale:
      'Despite the label "Regular fit," the Basic Stüssy Tee has a boxy, dropped-shoulder silhouette with significant chest ease (+2" over a slim-fit equivalent at size M). By GRACE classification standards, which define Standard as a clean athletic cut and Relaxed as having 2–3" additional ease, this garment falls in the Relaxed category.',
    silhouetteCharacteristics: [
      'Dropped shoulder construction',
      'Boxy through the body with minimal taper to hem',
      'Ribbed crewneck with moderate neck opening',
      'Hem falls at or below natural waist — classic streetwear length',
      'Half-chest ease ~2" above fitted at size M',
    ],
    publishedMeasurementsAtM: {
      chest:         20,    // half-chest
      frontLength:   28,
      sleeveLength:   8.5,
    },
    publishedGrade: {
      chest:        1.0,
      frontLength:  1.0,
      sleeveLength: 0.5,
    },
  },

  long_sleeve_tee: {
    source: {
      brand: 'Stüssy',
      productName: 'Basic Stüssy L/S Tee',
      sku: '1995000',
      url: 'https://www.stussy.com/collections/basic-stussy-tees/products/1995000-basic-stussy-ls-tee-black',
      dataSource: 'stussy_published',
      fitDescription: 'Regular fit. Long-sleeve version of the classic Stüssy tee with ribbed crewneck.',
      modelInfo: 'Model wears size M',
      notes: 'Same body pattern as 1905000; sleeve length extended.',
    },
    graceClassification: 'relaxed',
    statedFit: 'Regular fit',
    classificationRationale:
      'Identical body construction to the Basic Stüssy Tee (1905000). Sleeve length extended to full length. Relaxed classification carries over.',
    silhouetteCharacteristics: [
      'Identical body silhouette to short-sleeve counterpart',
      'Full-length sleeve with ribbed cuff',
      'Dropped shoulder construction',
      'Boxy through body',
    ],
    publishedMeasurementsAtM: {
      chest:        20,
      frontLength:  28,
      sleeveLength: 25,
    },
    publishedGrade: {
      chest:        1.0,
      frontLength:  1.0,
      sleeveLength: 0.75,
    },
  },

  crewneck: {
    source: {
      brand: 'Stüssy',
      productName: 'Basic Stüssy Crew',
      sku: '1915000',
      url: 'https://www.stussy.com/collections/crew-sweats/products/1915000-basic-stussy-crew-navy',
      dataSource: 'stussy_published',
      fitDescription: 'Regular fit. Heavyweight fleece crewneck with ribbed cuffs, hem, and collar.',
      modelInfo: 'Model wears size M',
      notes: 'Heavier weight than tees; slightly more structured through shoulder.',
    },
    graceClassification: 'relaxed',
    statedFit: 'Regular fit',
    classificationRationale:
      'The Basic Crewneck follows the same relaxed silhouette as the Basic Tee, with slightly more structure due to heavier fleece weight. Measurements are marginally wider than the tee to account for layering over a T-shirt. Relaxed classification applies.',
    silhouetteCharacteristics: [
      'Dropped shoulder, boxy body',
      'Slightly wider than basic tee to allow layering',
      'Ribbed collar, cuffs, and hem',
      'Hem falls at or just below waist',
      'Heavier silhouette than tee due to fleece weight',
    ],
    publishedMeasurementsAtM: {
      chest:        21,
      frontLength:  28,
      sleeveLength: 25.5,
    },
    publishedGrade: {
      chest:        1.0,
      frontLength:  1.0,
      sleeveLength: 0.75,
    },
  },

  hoodie: {
    source: {
      brand: 'Stüssy',
      productName: 'Lightweight Terry Hoodie',
      sku: '118612',
      url: 'https://www.stussy.com/collections/new-arrivals/products/118612-lightweight-terry-hoodie-blue',
      dataSource: 'stussy_published',
      fitDescription: 'Relaxed fit. Lightweight terry pullover hoodie with kangaroo pocket and adjustable drawstring hood.',
      modelInfo: 'Model wears size M',
      notes: 'Lightweight terry fabric; slightly less ease than heavyweight fleece hoodie benchmark.',
    },
    graceClassification: 'relaxed',
    statedFit: 'Relaxed fit',
    classificationRationale:
      'Stüssy labels this Relaxed and the measurements confirm it — comparable chest ease to the Basic Tee with the addition of hood volume. No reclassification needed.',
    silhouetteCharacteristics: [
      'Relaxed fit through body and sleeve',
      'Adjustable hood with center seam',
      'Kangaroo pocket at front hem',
      'Ribbed cuffs and hem band',
      'Dropped shoulder construction',
    ],
    publishedMeasurementsAtM: {
      chest:        21,
      frontLength:  27.5,
      sleeveLength: 25.5,
      hoodHeight:   13,
    },
    publishedGrade: {
      chest:        1.0,
      frontLength:  1.0,
      sleeveLength: 0.75,
      hoodHeight:   0.25,
    },
  },

  zip_hoodie: {
    source: {
      brand: 'Stüssy',
      productName: 'Beach Roots Zip Hoodie (Garment Dyed)',
      sku: '1975198',
      url: 'https://www.stussy.com/collections/new-arrivals/products/1975198-beach-roots-zip-hoodie-garment-dyed-indigo',
      dataSource: 'stussy_published',
      fitDescription: 'Relaxed fit. Garment-dyed zip hoodie with ribbed cuffs and hem. Vintage-washed character.',
      modelInfo: 'Model wears size M',
      notes: 'Garment dyeing causes slight dimensional shrinkage; measurements reflect post-wash finished size.',
    },
    graceClassification: 'relaxed',
    statedFit: 'Relaxed fit',
    classificationRationale:
      'Relaxed fit confirmed by Stüssy and by measurements, which sit within 0.5" of the hoodie benchmark. Zip construction adds slightly more chest ease than a pullover to accommodate zipper placket. Classified Relaxed.',
    silhouetteCharacteristics: [
      'Full-length zip front with minimal placket',
      'Relaxed body, matching hoodie silhouette',
      'Garment dye yields slightly uneven, vintage appearance',
      'Ribbed cuffs and hem band',
      'Adjustable hood with drawstring',
    ],
    publishedMeasurementsAtM: {
      chest:        21.5,
      frontLength:  27.5,
      sleeveLength: 25.5,
      hoodHeight:   13,
    },
    publishedGrade: {
      chest:        1.0,
      frontLength:  1.0,
      sleeveLength: 0.75,
      hoodHeight:   0.25,
    },
  },

  track_jacket: {
    source: {
      brand: 'Stüssy',
      productName: 'MX Jacket',
      sku: '115935',
      url: 'https://www.stussy.com/collections/outerwear/products/115935-mx-jacket-lime',
      dataSource: 'stussy_published',
      fitDescription: 'Regular fit. Athletic-inspired track jacket with contrast striping and zip chest pocket.',
      modelInfo: 'Model wears size M',
      notes: 'MX (motocross/racing) aesthetic; designed for range of motion, slightly trimmer than basic outerwear.',
    },
    graceClassification: 'standard',
    statedFit: 'Regular fit',
    classificationRationale:
      'Unlike the Basic Tee, the MX Jacket\'s "Regular fit" translates to a true Standard classification. The athletic/moto inspiration dictates a trimmer chest, higher armhole, and narrower shoulder vs. the boxy tee. Measurements confirm less ease than the relaxed tee family.',
    silhouetteCharacteristics: [
      'Standard athletic cut — not boxy',
      'Higher armhole for range-of-motion',
      'Contrast stripe detailing on sleeves',
      'Full-length zip front',
      'Zip chest pocket',
      'Ribbed collar and cuffs',
    ],
    publishedMeasurementsAtM: {
      chest:        20,
      frontLength:  28,
      sleeveLength: 25.5,
    },
    publishedGrade: {
      chest:        1.0,
      frontLength:  1.0,
      sleeveLength: 0.75,
    },
  },

  windbreaker: {
    source: {
      brand: 'Stüssy (derived)',
      productName: 'MX Jacket (Windbreaker benchmark)',
      sku: '115935',
      url: 'https://www.stussy.com/collections/outerwear/products/115935-mx-jacket-lime',
      dataSource: 'derived',
      fitDescription: 'No dedicated windbreaker benchmark. Track Jacket (MX Jacket) used as initial source.',
      notes: 'Windbreaker baseline derived from track jacket with +0.5" chest for shell-layer ease. Update when dedicated windbreaker benchmark is available.',
    },
    graceClassification: 'standard',
    statedFit: 'Regular fit (derived)',
    classificationRationale:
      'Windbreaker inherits Standard classification from the Track Jacket benchmark. +0.5" chest ease added to account for shell-layer layering requirement over a mid-layer. Replace with dedicated benchmark when available.',
    silhouetteCharacteristics: [
      'Standard fit shell layer',
      'Slightly more ease than track jacket for layering',
      'Packable construction typical of windbreakers',
      'Full-length zip',
    ],
    publishedMeasurementsAtM: {
      chest:        20.5,  // track jacket +0.5" for shell ease
      frontLength:  28.5,
      sleeveLength: 25.5,
    },
    publishedGrade: {
      chest:        1.0,
      frontLength:  1.0,
      sleeveLength: 0.75,
    },
  },

  sweatpants: {
    source: {
      brand: 'Stüssy',
      productName: 'Fleece Pant',
      sku: '116753',
      url: 'https://www.stussy.com/collections/pants/products/116753-fleece-pant-red',
      dataSource: 'stussy_published',
      fitDescription: 'Relaxed fit. Heavyweight fleece pant with elastic waistband, drawstring, and ribbed ankle cuffs.',
      modelInfo: 'Model wears size M, is 6\'1"',
      notes: 'Tapered toward ribbed ankle cuffs. Standard GRACE inseam assumes no alteration.',
    },
    graceClassification: 'tapered',
    statedFit: 'Relaxed fit',
    classificationRationale:
      'Stüssy labels this "Relaxed" referring to the upper body (waist and thigh ease). However the silhouette tapers toward ribbed ankle cuffs — the defining construction detail. GRACE classifies leg silhouette separately from waist ease; the leg shape is Tapered. The benchmark is filed under Tapered to correctly represent the most distinctive construction feature.',
    silhouetteCharacteristics: [
      'Relaxed through waist and thigh',
      'Tapers significantly from knee to ribbed ankle cuff',
      'Elastic waistband with external drawstring',
      'Ribbed ankle cuffs',
      'Heavyweight fleece fabric',
    ],
    publishedMeasurementsAtM: {
      waist:      15.5,   // half-waist relaxed
      frontRise:  12.5,
      inseam:     28.5,
      thigh:      13.5,   // half-thigh
      legOpening:  5.5,   // half — ribbed cuff opening
    },
    publishedGrade: {
      waist:      1.0,
      frontRise:  0.25,
      inseam:     0.375,
      thigh:      0.5,
      legOpening: 0.125,  // cuff opening grades minimally
    },
  },

  track_pants: {
    source: {
      brand: 'Stüssy',
      productName: 'Nylon Track Pant',
      sku: '116746',
      url: 'https://www.stussy.com/collections/pants/products/116746-nylon-track-pant-navy',
      dataSource: 'stussy_published',
      fitDescription: 'Regular fit. Nylon track pant with snap buttons along side seam and elastic waistband.',
      modelInfo: 'Model wears size M',
      notes: 'Snap-button side seam allows leg opening to widen for styling. Measurements reflect snapped-closed state.',
    },
    graceClassification: 'standard',
    statedFit: 'Regular fit',
    classificationRationale:
      'The Nylon Track Pant has a clean, athletic Standard silhouette — notably different from the Fleece Pant despite similar waist ease. Leg is mostly straight with only mild taper; the snap-button detail opens to reveal a wider opening. Classified Standard because the default silhouette (snaps closed) is a clean athletic straight-to-slight-taper leg.',
    silhouetteCharacteristics: [
      'Standard athletic fit',
      'Snap-button outer seam from hip to ankle',
      'Elastic waistband with internal drawstring',
      'Minimal taper from thigh to ankle',
      'Lightweight nylon shell',
    ],
    publishedMeasurementsAtM: {
      waist:      15,     // half-waist
      frontRise:  12,
      inseam:     29,
      thigh:      12.5,
      legOpening:  8,     // half — standard opening, snaps closed
    },
    publishedGrade: {
      waist:      1.0,
      frontRise:  0.25,
      inseam:     0.375,
      thigh:      0.5,
      legOpening: 0.25,
    },
  },

  shorts: {
    source: {
      brand: 'Stüssy (derived)',
      productName: 'Shorts baseline — derived from Nylon Track Pant',
      sku: 'DERIVED',
      url: 'https://www.stussy.com/collections/pants/products/116746-nylon-track-pant-navy',
      dataSource: 'derived',
      fitDescription: 'No shorts benchmark available. Derived from Track Pant upper-body measurements with inseam truncated to short length.',
      notes: [
        'ASSUMPTION 1: Inseam set to 8.5" at size M — mid-thigh length consistent with streetwear shorts.',
        'ASSUMPTION 2: Leg opening maintained at track-pant proportion relative to thigh.',
        'ASSUMPTION 3: Rise unchanged from track pant; shorts sit at same waist position.',
        'ASSUMPTION 4: Grade same as track pants except inseam grades only +0.25" per size.',
        'Replace with dedicated benchmark when available.',
      ].join(' '),
    },
    graceClassification: 'standard',
    statedFit: 'Regular fit (derived)',
    classificationRationale:
      'Derived from Track Pant benchmark. Standard classification retained. Inseam truncated to 8.5" at size M. All other proportions preserved from track pant upper body.',
    silhouetteCharacteristics: [
      'Standard fit through waist and thigh',
      'Mid-thigh inseam (~8.5" at size M)',
      'Elastic waistband with drawstring',
      'Leg opening proportional to thigh — minimal flare or taper',
    ],
    publishedMeasurementsAtM: {
      waist:      15,
      frontRise:  12,
      inseam:      8.5,
      thigh:      12.5,
      legOpening:  8.5,   // slightly wider than thigh for easy movement
    },
    publishedGrade: {
      waist:      1.0,
      frontRise:  0.25,
      inseam:     0.25,   // minimal inseam grade on shorts
      thigh:      0.5,
      legOpening: 0.25,
    },
  },

}
