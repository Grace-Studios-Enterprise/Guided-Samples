// Real tech-pack generator. Assembles a full production tech pack from GRACE's
// existing fitBlocks engine (graded measurements + placements) and serializes it
// to a self-contained, printable HTML document. Wired behind the "Generate full
// tech pack" prepress fix and the assistant's tech-pack action.

import { buildTechPackDocument, techPackToHtml, garmentDisplayName } from '@/lib/fitBlocks/techPackExport'
import { resolveGarmentType } from '@/lib/fitBlocks'
import type { GarmentType } from '@/lib/fitBlocks/types'

export interface GeneratedTechPack {
  filename: string
  content: string
  mime: string
  summary: string
}

export function generateTechPack(garmentHint?: string, styleName?: string): GeneratedTechPack | null {
  const gt = (garmentHint && resolveGarmentType(garmentHint)) || ('short_sleeve_tee' as GarmentType)
  const doc = buildTechPackDocument(gt, undefined, undefined, {
    styleName: styleName || `GRACE ${garmentDisplayName(gt)}`,
    brand: 'GRACE',
    revision: 'A',
  })
  if (!doc) return null
  return {
    filename: 'grace-tech-pack.html',
    content: techPackToHtml(doc),
    mime: 'text/html',
    summary: `Generated a production tech pack for a ${doc.fitLabel.toLowerCase()} ${garmentDisplayName(doc.garmentType)} — ${doc.measurementRows.length} graded measurements across XS–3XL plus placement specs. Open it to review or print to PDF.`,
  }
}
