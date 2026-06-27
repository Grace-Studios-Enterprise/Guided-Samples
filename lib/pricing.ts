/**
 * GRACE — central pricing source of truth (all values in cents)
 *
 * Every checkout route, the Stripe webhook, and the production service layer
 * import from here so prices never drift between code paths.
 *
 * Pricing model:
 *   • Production (bulk) price is the per-piece price for a full run.
 *   • Sample price is exactly 2× the per-piece production price (one sample).
 *   • A flat activation fee is charged once per order.
 *   • Each additional logo placement is a flat per-piece fee.
 */

import type { Tier } from './tiers'
import { tierPerks } from './tiers'

// One-time setup fee charged per production order (Free tier only — waived for
// Designer/Brand subscribers). Historically called the "activation fee".
export const ACTIVATION_FEE_CENTS = 2_500 // $25.00

// Flat fee per additional logo placement (beyond the first, which is included).
export const EXTRA_LOGO_FEE_CENTS = 400 // $4.00

// Per-piece production (bulk) pricing by garment type.
export const PRODUCTION_PRICE_CENTS: Record<string, number> = {
  'T-Shirt':            2_500, // $25
  'Hoodie':             4_500, // $45
  'Zip Hoodie':         5_000, // $50
  'Crewneck':           3_500, // $35
  'Track Jacket':       3_500, // $35
  'Track Pants':        3_500, // $35
  'Windbreaker':        4_000, // $40
  'Basketball Jersey':  2_000, // $20
  'Shorts':             3_500, // $35 — same as Sweatpants
  'Sweatpants':         3_500, // $35
}

// Fallback used when a garment type isn't in the table above.
const DEFAULT_PRODUCTION_PRICE_CENTS = 3_500 // $35

// Team uniform orders are priced flat regardless of garment subtype.
export const UNIFORM_PRODUCTION_PRICE_CENTS = 4_000 // $40

// Reversible jerseys are a flat rate, regardless of sport.
export const REVERSIBLE_JERSEY_PRODUCTION_PRICE_CENTS = 8_000 // $80

// Bulk production quantity bounds. MOQ (minimum order quantity) is 15 pieces.
export const MIN_PRODUCTION_QUANTITY = 15
export const MAX_PRODUCTION_QUANTITY = 100_000

/** Per-piece production (bulk) price for a garment type. Uniform orders are a flat rate; reversible jerseys are a separate flat rate. */
export function productionPriceCents(garmentType: string, isUniform?: boolean, isReversible?: boolean): number {
  if (isReversible) return REVERSIBLE_JERSEY_PRODUCTION_PRICE_CENTS
  if (isUniform) return UNIFORM_PRODUCTION_PRICE_CENTS
  return PRODUCTION_PRICE_CENTS[garmentType] ?? DEFAULT_PRODUCTION_PRICE_CENTS
}

/** Sample price for a garment type — double the per-piece production price. */
export function samplePriceCents(garmentType: string, isUniform?: boolean, isReversible?: boolean): number {
  return productionPriceCents(garmentType, isUniform, isReversible) * 2
}

/** Clamp/normalise a client-supplied quantity to a safe integer in range. */
export function clampQuantity(quantity: unknown): number {
  const n = Number(quantity)
  if (!Number.isFinite(n)) return MIN_PRODUCTION_QUANTITY
  return Math.min(MAX_PRODUCTION_QUANTITY, Math.max(MIN_PRODUCTION_QUANTITY, Math.floor(n)))
}

/**
 * Full bulk production subtotal (cents) for a run:
 *   (per-piece price + per-piece extra-logo fee) × quantity
 */
export function bulkSubtotalCents(
  unitPriceCents: number,
  extraLogoFeeCents: number,
  quantity: number,
): number {
  const qty = clampQuantity(quantity)
  return (unitPriceCents + extraLogoFeeCents) * qty
}

// ─── Tier-aware adjustments ─────────────────────────────────────────────────
// The setup fee is waived for subscribers; Brand gets a flat % off the
// production order. Per-piece prices, 2× sample, $4/extra-logo and the 50/50
// split are unchanged — these helpers just apply the membership layer on top.

/** The setup fee actually due for a tier ($25 for Free, $0 for subscribers). */
export function setupFeeCentsFor(tier: Tier): number {
  return tierPerks(tier).setupWaived ? 0 : ACTIVATION_FEE_CENTS
}

/** Production discount fraction for a tier (e.g. 0.05 for Brand). */
export function productionDiscount(tier: Tier): number {
  return tierPerks(tier).productionDiscountPct / 100
}

/** Apply a tier's production discount to a cents amount (rounded). */
export function applyTierDiscount(cents: number, tier: Tier): number {
  const d = productionDiscount(tier)
  return d > 0 ? Math.round(cents * (1 - d)) : cents
}

/** 50% deposit (cents), rounded to the nearest cent. */
export function depositCents(subtotalCents: number): number {
  return Math.round(subtotalCents / 2)
}

/** Remaining balance (cents) after the deposit — the two halves sum to subtotal. */
export function finalBalanceCents(subtotalCents: number): number {
  return subtotalCents - depositCents(subtotalCents)
}
