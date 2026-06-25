// GRACE Assistant action registry. Guided buttons map to handlers here. Most are
// guidance stubs for now — replace each body with a real operation (size-spec
// generation, CMYK/Pantone conversion, navigation, checkout, …) without touching
// the assistant UI. The host app can also intercept ids for navigation.

import type { AssistantContext, QuickAction } from './types'

export interface ActionResult {
  text: string
  actions?: QuickAction[]
}

type Handler = (ctx: AssistantContext) => ActionResult

const REGISTRY: Record<string, Handler> = {
  escalate: () => ({
    text: 'I’ve flagged this for the GRACE production team — they’ll follow up by email with full context on where you are. Anything you’d like me to add to the note?',
  }),
  'create-size-spec': () => ({
    text: 'I can generate a graded size spec (XS–3XL) from a standard fit block for your garment and add it to your files, so production has consistent measurements.',
  }),
  'upload-size-chart': () => ({
    text: 'Add your size chart on the upload screen and I’ll fold it into the readiness check automatically — no need to re-run everything.',
  }),
  'use-standard-fit': () => ({
    text: 'We’ll apply GRACE’s standard graded fit for your garment so production can proceed. You can refine the measurements anytime before sampling.',
  }),
  'generate-placement': () => ({
    text: 'I’ll generate placement specs — offset from collar, print width, and alignment — for each location and attach them to your tech pack.',
  }),
  'specify-decoration': () => ({
    text: 'I’d recommend a decoration method and note it on the spec: screen print for bold, few-color art at volume; DTG for full-color or photographic; embroidery for premium logo work.',
  }),
  'convert-cmyk': () => ({
    text: 'I’ll convert your artwork to CMYK and flag any colors that won’t reproduce cleanly on press.',
  }),
  'convert-pantone': () => ({
    text: 'I’ll map your colors to the nearest Pantone spot references and add them to the spec for consistent runs.',
  }),
  'start-sample': () => ({
    text: 'A sample is the safest next step — one finished piece to approve fit, fabric, and print before your full run. You can start it from checkout.',
  }),
  'start-production': () => ({
    text: 'Ready to commit? The production deposit starts your full run. If you haven’t sampled yet, I’d still suggest it first.',
  }),
  'send-production': () => ({
    text: 'Once your tech pack is complete, Send to Production packages everything for your supplier. Want me to check it’s complete first?',
  }),
  continue: () => ({
    text: 'You’re production-ready — use Continue to Manufacturing on this screen and I’ll stay with you through checkout.',
  }),
  'goto-upload': () => ({
    text: 'Choose **Upload Production Files** on the home screen, drop your artwork, and I’ll read the preflight report with you.',
  }),
  'goto-studio': () => ({
    text: 'Open **the Studio** from the home screen to start building. I’ll help with logos, placement, and your tech pack as you go.',
  }),
}

export function runAction(id: string, ctx: AssistantContext): ActionResult {
  const handler = REGISTRY[id]
  if (handler) return handler(ctx)
  return { text: 'Noted — this action will be wired up shortly. In the meantime I can explain the step or connect you with the GRACE team.' }
}

export const hasAction = (id: string) => id in REGISTRY
