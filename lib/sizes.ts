/**
 * Size breakdown helpers
 *
 * A size breakdown records how many pieces are ordered per size, e.g.
 * { S: 3, M: 4, L: 2 }. The sum is the total production/sample quantity.
 */

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const
export type Size = (typeof SIZES)[number]

export type SizeBreakdown = Record<string, number>

/** An empty breakdown with every size at 0. */
export function emptyBreakdown(): SizeBreakdown {
  return SIZES.reduce<SizeBreakdown>((acc, s) => { acc[s] = 0; return acc }, {})
}

/** Total pieces across all sizes. */
export function sumBreakdown(breakdown: SizeBreakdown | null | undefined): number {
  if (!breakdown) return 0
  return Object.values(breakdown).reduce((sum, n) => sum + (Number(n) || 0), 0)
}

/** Normalise arbitrary input into a clean { size: nonNegativeInt } map. */
export function normalizeBreakdown(input: unknown): SizeBreakdown {
  const out = emptyBreakdown()
  if (input && typeof input === 'object') {
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      const n = Math.max(0, Math.floor(Number(v) || 0))
      if (n > 0) out[k] = (out[k] ?? 0) + n
    }
  }
  return out
}

/** Human-readable summary, e.g. "3 S · 4 M · 2 L". */
export function formatBreakdown(breakdown: SizeBreakdown | null | undefined): string {
  if (!breakdown) return '—'
  const parts = SIZES
    .filter(s => (breakdown[s] ?? 0) > 0)
    .map(s => `${breakdown[s]} ${s}`)
  // Include any non-standard sizes that may exist in stored data.
  for (const [k, v] of Object.entries(breakdown)) {
    if (!SIZES.includes(k as Size) && (Number(v) || 0) > 0) parts.push(`${v} ${k}`)
  }
  return parts.length ? parts.join(' · ') : '—'
}
