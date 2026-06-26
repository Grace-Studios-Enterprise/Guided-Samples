// Assembles the REAL project context the assistant is allowed to reason over.
// Everything here is read from actual app state / stores — the model is told to
// answer only from this and never invent. Kept compact to fit the prompt.

import { listSizeProfiles } from '@/lib/sizing/store'
import type { AssistantContext } from './types'

export interface Grounding {
  pathType: string
  currentStage?: string
  projectId?: string | null
  orderId?: string | null
  design?: { garment?: string; hasLogo?: boolean; phase?: number }
  uploadedFiles?: { name: string; kind: string }[]
  prepress?: {
    score: number
    ready: boolean
    criticals: number
    warnings: number
    issues: { label: string; status: string; detail: string }[]
  }
  sizeProfiles?: {
    name: string
    source: string
    garment?: string
    brand?: string
    sizes: string[]
    measurements: { label: string; values: Record<string, number> }[]
  }[]
}

export function buildGrounding(ctx: AssistantContext): Grounding {
  const g: Grounding = {
    pathType: ctx.pathType,
    currentStage: ctx.currentStage,
    projectId: ctx.projectId ?? undefined,
    orderId: ctx.orderId ?? undefined,
  }

  if (ctx.designState && (ctx.designState.garment || ctx.designState.hasLogo || ctx.designState.phase)) {
    g.design = { garment: ctx.designState.garment, hasLogo: ctx.designState.hasLogo, phase: ctx.designState.phase }
  }

  if (ctx.uploadedFiles?.length) g.uploadedFiles = ctx.uploadedFiles.slice(0, 20)

  const r = ctx.prepressReport
  if (r) {
    g.prepress = {
      score: r.score,
      ready: r.ready,
      criticals: r.summary.critical,
      warnings: r.summary.warning,
      issues: r.results
        .filter(x => x.status === 'critical' || x.status === 'warning')
        .slice(0, 12)
        .map(x => ({ label: x.label, status: x.status, detail: x.detail })),
    }
  }

  // Saved sizing source of truth (compact).
  try {
    const profiles = listSizeProfiles().slice(0, 5)
    if (profiles.length) {
      g.sizeProfiles = profiles.map(p => ({
        name: p.name,
        source: p.source,
        garment: p.garmentType,
        brand: p.brand,
        sizes: p.sizes,
        measurements: p.rows.slice(0, 10).map(row => ({ label: row.label, values: row.values })),
      }))
    }
  } catch {}

  return g
}
