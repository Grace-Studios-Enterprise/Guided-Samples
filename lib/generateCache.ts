// In-memory generation result cache — keyed by input hash, 30-min TTL.
// Images are large; we keep them in memory only (no localStorage) to avoid
// storage quota issues, and accept that they clear on page refresh.

type Entry<T> = { v: T; exp: number }
const mem = new Map<string, Entry<unknown>>()

export function cacheGet<T>(key: string): T | null {
  const e = mem.get(key) as Entry<T> | undefined
  if (!e) return null
  if (e.exp < Date.now()) { mem.delete(key); return null }
  return e.v
}

export function cacheSet<T>(key: string, value: T, ttlMs = 30 * 60_000): void {
  mem.set(key, { v: value, exp: Date.now() + ttlMs })
}

export function cacheKey(...parts: (string | undefined | null)[]): string {
  const s = parts.map(p => p ?? '').join('|')
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}
