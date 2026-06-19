// Background cleanup for uploaded logos and artwork.
//
// Uses the client-side BFS flood-fill exclusively. It only clears the OUTER
// connected background region reachable from the image border, so every interior
// pixel — including the multi-stroke outline borders on letters (e.g. the GRACE
// gold+black double border) — is preserved.
//
// The Replicate/rembg (U²-Net) model is intentionally NOT used here: it is a
// subject-segmentation model that treats those outline strokes as background and
// strips them, which is exactly the border-loss the user reported. Flood-fill is
// deterministic, so the same upload also produces identical bytes every time,
// which lets the Library deduplicate repeats of the same logo.
// Intentionally skips background removal so uploaded logos/artwork are
// preserved exactly as the user provided them (borders, multi-stroke outlines,
// colored backgrounds all intact). Users who want a transparent background
// should upload a pre-cut PNG.
export async function cleanupBackground(dataUrl: string): Promise<string> {
  return dataUrl
}

// Opt-in deep background removal. Sends the image to the server's Replicate
// (rembg/U²-Net) pipeline for a true alpha-channel cutout. This is more
// aggressive than the flood-fill and may trim fine outline strokes, so it's
// only ever run when the user explicitly asks for a cleaner background.
// Falls back to the original image if the service is unavailable.
export async function cleanBackgroundRemote(dataUrl: string): Promise<string> {
  try {
    const res = await fetch('/api/remove-bg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
    })
    if (!res.ok) return dataUrl
    const data = await res.json()
    return typeof data.image === 'string' ? data.image : dataUrl
  } catch {
    return dataUrl
  }
}

// Load a data URL into an HTMLImageElement.
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = dataUrl
  })
}

// Crop fully-transparent margins so the logo content fills its bounding box.
// Fixes uploads/cutouts that carry large empty padding, which otherwise makes
// the artwork appear tiny and off-center inside its placement box.
export async function trimTransparent(dataUrl: string, alphaThreshold = 10): Promise<string> {
  try {
    const img = await loadImage(dataUrl)
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return dataUrl
    ctx.drawImage(img, 0, 0)

    const { width: w, height: h } = canvas
    const px = ctx.getImageData(0, 0, w, h).data

    let minX = w, minY = h, maxX = -1, maxY = -1
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (px[(y * w + x) * 4 + 3] > alphaThreshold) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }

    if (maxX < minX) return dataUrl // fully transparent — nothing to trim
    const tw = maxX - minX + 1
    const th = maxY - minY + 1
    if (tw === w && th === h) return dataUrl // already tight

    const out = document.createElement('canvas')
    out.width = tw
    out.height = th
    const octx = out.getContext('2d')
    if (!octx) return dataUrl
    octx.drawImage(img, minX, minY, tw, th, 0, 0, tw, th)
    return out.toDataURL('image/png')
  } catch {
    return dataUrl
  }
}

// Full client-side cleanup used by the "Remove Background" action and on upload:
// flood-fills the outer solid background to transparency (preserving interior
// outline strokes), then trims the empty margins. Deterministic and dependency
// free — no external API required.
export async function removeBackgroundClean(dataUrl: string): Promise<string> {
  let out = dataUrl
  try { out = await removeWhiteBackground(out) } catch {}
  try { out = await trimTransparent(out) } catch {}
  return out
}

// Remove the background from a logo image via a BFS flood-fill that understands
// MULTI-COLOR backgrounds.
//
// Instead of detecting one averaged background color, it builds a small *palette*
// of the colors that actually appear along the image border. A solid background
// yields one palette color; a baked-in transparency checkerboard yields two
// (white + light gray); a gradient yields a few. A pixel counts as background if
// it's opaque and matches ANY palette color within tolerance. The flood-fill
// then clears only the OUTER connected region reachable from the border, so
// interior strokes (e.g. the GRACE gold/black double border or the ram crest)
// are preserved because they aren't border colors and aren't reachable.
//
// If the border is fully transparent (the logo is already cut out, like the
// transparent GRACE PNG), the palette is empty and the image is returned
// untouched — never risking damage to an already-clean logo.
export async function removeWhiteBackground(dataUrl: string, tolerance = 32): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = dataUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0)

  const { width: w, height: h } = canvas
  const imageData = ctx.getImageData(0, 0, w, h)
  const px = imageData.data

  // ── Build the border-color palette ─────────────────────────────────────────
  // Sample a thin band along all four edges, quantize each opaque color into a
  // coarse 16-level bucket, and keep the buckets that make up a meaningful
  // fraction of the border. This robustly captures a checkerboard's two tones.
  const band = Math.max(2, Math.min(6, Math.round(Math.min(w, h) * 0.02)))
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>()
  const sample = (x: number, y: number) => {
    const idx = (y * w + x) * 4
    if (px[idx + 3] < 10) return // skip transparent border pixels
    const r = px[idx], g = px[idx + 1], b = px[idx + 2]
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
    const e = buckets.get(key)
    if (e) { e.r += r; e.g += g; e.b += b; e.n++ }
    else buckets.set(key, { r, g, b, n: 1 })
  }
  for (let y = 0; y < h; y++) for (let d = 0; d < band; d++) { sample(d, y); sample(w - 1 - d, y) }
  for (let x = 0; x < w; x++) for (let d = 0; d < band; d++) { sample(x, d); sample(x, h - 1 - d) }

  const bucketList = Array.from(buckets.values())
  const totalSamples = bucketList.reduce((s, e) => s + e.n, 0)
  // Border fully (or almost) transparent → already cut out, leave untouched.
  if (totalSamples === 0) return dataUrl

  // Keep buckets that are at least 6% of border samples, up to 4 palette colors.
  const palette = bucketList
    .filter(e => e.n / totalSamples >= 0.06)
    .sort((a, b) => b.n - a.n)
    .slice(0, 4)
    .map(e => ({ r: Math.round(e.r / e.n), g: Math.round(e.g / e.n), b: Math.round(e.b / e.n) }))
  if (palette.length === 0) return dataUrl

  const isBg = (idx: number) => {
    if (px[idx + 3] <= 10) return false // already transparent
    const r = px[idx], g = px[idx + 1], b = px[idx + 2]
    for (const c of palette) {
      if (Math.abs(r - c.r) <= tolerance && Math.abs(g - c.g) <= tolerance && Math.abs(b - c.b) <= tolerance) return true
    }
    return false
  }

  // ── BFS flood fill from all border pixels ──────────────────────────────────
  const visited = new Uint8Array(w * h)
  const queue: number[] = []
  const push = (x: number, y: number) => {
    const p = y * w + x
    if (visited[p]) return
    visited[p] = 1
    if (isBg(p * 4)) queue.push(p)
    else visited[p] = 2
  }
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1) }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y) }

  while (queue.length) {
    const p = queue.pop()!
    px[p * 4 + 3] = 0
    const x = p % w
    const y = (p / w) | 0
    if (x > 0) push(x - 1, y)
    if (x < w - 1) push(x + 1, y)
    if (y > 0) push(x, y - 1)
    if (y < h - 1) push(x, y + 1)
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}
