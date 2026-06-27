// GRACE membership tiers — the single source of truth for plan perks.
//
// Three tiers, one transactional production layer on top:
//   Free      $0/mo   — design + 3 AI generations, pays the $25 setup fee.
//   Designer  $19/mo  — unlimited AI, full studio/exports, 1 size profile, setup waived.
//   Brand     $79/mo  — everything + 5% off production, unlimited size profiles,
//                       priority queue, Creative Direction included, setup waived.

export type Tier = 'free' | 'designer' | 'brand'

export interface TierPerks {
  label: string
  monthlyPriceCents: number
  /** AI generations are unlimited (no per-generation gating). */
  unlimitedAI: boolean
  /** The one-time $25 production setup fee is waived. */
  setupWaived: boolean
  /** Percent off every production order (sample / deposit / final). 0 = none. */
  productionDiscountPct: number
  /** Max saved size profiles. null = unlimited. */
  sizeProfileLimit: number | null
  /** Production is prioritized in the supplier queue. */
  priorityQueue: boolean
  /** Creative Direction included as a membership perk. */
  creativeDirectionIncluded: boolean
}

export const TIERS: Record<Tier, TierPerks> = {
  free: {
    label: 'Free', monthlyPriceCents: 0,
    unlimitedAI: false, setupWaived: false, productionDiscountPct: 0,
    sizeProfileLimit: 1, priorityQueue: false, creativeDirectionIncluded: false,
  },
  designer: {
    label: 'Designer', monthlyPriceCents: 1900,
    unlimitedAI: true, setupWaived: true, productionDiscountPct: 0,
    sizeProfileLimit: 1, priorityQueue: false, creativeDirectionIncluded: false,
  },
  brand: {
    label: 'Brand', monthlyPriceCents: 7900,
    unlimitedAI: true, setupWaived: true, productionDiscountPct: 5,
    sizeProfileLimit: null, priorityQueue: true, creativeDirectionIncluded: true,
  },
}

export const isValidTier = (t: unknown): t is Tier =>
  t === 'free' || t === 'designer' || t === 'brand'

export const tierPerks = (t: Tier): TierPerks => TIERS[t]

/** Stripe recurring Price ID for a paid tier (set in env, created in Stripe). */
export function tierPriceId(t: Tier): string | undefined {
  if (t === 'designer') return process.env.STRIPE_DESIGNER_PRICE_ID
  if (t === 'brand') return process.env.STRIPE_BRAND_PRICE_ID
  return undefined
}
