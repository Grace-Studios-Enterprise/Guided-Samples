/**
 * Convert an uploaded File (PNG, SVG, or PDF) to a PNG data URL suitable for
 * use as a canvas layer or logo preview.
 *
 * - PNG/JPEG/WEBP  → read directly as data URL
 * - SVG            → rasterize via an off-screen canvas at 2× for crisp edges
 * - PDF            → render first page via pdfjs-dist at 2× device-pixel scale
 */

export async function fileToDataUrl(file: File): Promise<string> {
  const mime = file.type.toLowerCase()

  if (mime === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return rasterizeSvg(file)
  }

  if (mime === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return rasterizePdf(file)
  }

  // Raster images (PNG, JPEG, WEBP, GIF, …)
  return readAsDataUrl(file)
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function rasterizeSvg(file: File): Promise<string> {
  const svgText = await file.text()
  const blob = new Blob([svgText], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = 2
      const w = img.naturalWidth  || 800
      const h = img.naturalHeight || 800
      const canvas = document.createElement('canvas')
      canvas.width  = w * scale
      canvas.height = h * scale
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG render failed')) }
    img.src = url
  })
}

async function rasterizePdf(file: File): Promise<string> {
  // Dynamically import pdfjs so it doesn't inflate the server bundle
  const pdfjsLib = await import('pdfjs-dist')
  // Point the worker at the bundled worker — Next.js copies public assets automatically
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

  const arrayBuffer = await file.arrayBuffer()
  const pdf  = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const page = await pdf.getPage(1)

  const scale = 2
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width  = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')!

  await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport, canvas }).promise
  return canvas.toDataURL('image/png')
}
