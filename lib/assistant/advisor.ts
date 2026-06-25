// Heuristic, context-aware advisor. Turns an AssistantContext into a proactive
// summary + guided actions, and answers follow-up questions. GRACE tone: calm,
// premium, clear, production-aware. Swap `greet`/`reply` for an LLM call later —
// the message + action shapes stay the same.

import type { AssistantContext, AssistantMessage, QuickAction } from './types'

let _seq = 0
const id = () => `m${++_seq}-${Date.now()}`
const msg = (text: string, actions?: QuickAction[]): AssistantMessage => ({ id: id(), role: 'assistant', text, actions })
const act = (label: string, opts: Partial<QuickAction> = {}): QuickAction => ({ id: opts.run ?? opts.say ?? label, label, ...opts })

const TALK = act('Talk to GRACE team', { run: 'escalate', tone: 'ghost' })

// Non-passing prepress items → plain-English label.
function missingFromReport(ctx: AssistantContext): string[] {
  const r = ctx.prepressReport
  if (!r) return ctx.missingItems ?? []
  return r.results.filter(x => x.status === 'critical' || x.status === 'warning').map(x => x.label)
}

// ── Proactive summary per path ────────────────────────────────────────────────
export function greet(ctx: AssistantContext): AssistantMessage {
  switch (ctx.pathType) {
    case 'landing':
      return msg(
        'Welcome to GRACE. There are three ways to start — full-service Creative Direction, build it yourself in the Studio, or upload production-ready files for a preflight check. Tell me what you have and I’ll point you to the fastest path.',
        [act('Which path is right for me?', { say: 'Which path should I choose?', tone: 'primary' }),
         act('I already have artwork', { say: 'I already have finished artwork — what should I do?' })])

    case 'creative':
      return msg(
        'You’re in Creative Direction — our studio handles concept, tech pack, and production direction for you. The more detail in your brief, the sharper the result.',
        [act('What should my brief include?', { say: 'What should I include in my brief?', tone: 'primary' }), TALK])

    case 'studio':
      return studioGreet(ctx)

    case 'upload':
      return uploadGreet(ctx)

    case 'techpack':
      return techpackGreet(ctx)

    case 'checkout':
      return msg(
        'Two ways to move forward: a **Sample order** — one piece to confirm fit, color, and print before you commit — or a **Production deposit**, which starts your full run. We almost always recommend a sample first.',
        [act('Sample vs production?', { say: 'Explain sample-only vs production deposit', tone: 'primary' }),
         act('What’s the deposit for?', { say: 'What does the production deposit cover?' }), TALK])

    case 'orders':
      return msg(
        ctx.orderId
          ? `Tracking order ${shortId(ctx.orderId)}. I’ll keep an eye on each production stage and flag anything that needs you.`
          : 'I’ll summarize where your order is and what happens next at each stage.',
        [act('What happens next?', { say: 'What happens in the next production stage?', tone: 'primary' }), TALK])

    default:
      return msg('I’m here to help you know what’s next at every step. What are you working on?')
  }
}

function studioGreet(ctx: AssistantContext): AssistantMessage {
  switch (ctx.currentStage) {
    case 'route':
      return msg('Choose your route: **Custom Apparel** for hoodies, tees, crewnecks and more, or **Team Uniforms** for roster-based kits. You can change garment details later.',
        [act('Help me choose', { say: 'Custom apparel or team uniforms — which fits my project?', tone: 'primary' })])
    case 'logo':
      return msg('Stuck on your logo? Tell me your brand’s vibe — style, era, audience — and I’ll help you write a stronger generation prompt.',
        [act('Improve my logo prompt', { say: 'Help me write a better logo prompt', tone: 'primary' })])
    case 'design':
      return msg('Placing your design: for a chest print, keep the artwork around 4.5″ below the collar and centered. I can suggest placement and the right decoration method.',
        [act('Placement tips', { say: 'How should I place my artwork?', tone: 'primary' }),
         act('Which decoration method?', { say: 'Which decoration method should I use?' })])
    case 'preview':
      return msg('Preview is optional. Generate a realistic render to see it in context, or continue straight to your tech pack — both are valid.',
        [act('Proceed or preview?', { say: 'Should I generate a preview or move on?', tone: 'primary' })])
    default:
      return msg('You’re in the Design Studio. I can help with logos, garment choice, placement, and prepping your tech pack. Where are you stuck?',
        [act('Improve my prompt', { say: 'Help me write a better AI prompt' }),
         act('Placement tips', { say: 'How should I place my artwork?' })])
  }
}

function uploadGreet(ctx: AssistantContext): AssistantMessage {
  const r = ctx.prepressReport
  if (!r) {
    return msg('Drop your production files and I’ll read the preflight report with you — then explain exactly what’s ready and what to fix.')
  }
  const missing = missingFromReport(ctx)
  if (r.ready) {
    return msg(`Good news — your files scored **${r.score}/100** and passed every critical check. You can continue to manufacturing, or tighten the remaining ${r.summary.warning} warning${r.summary.warning === 1 ? '' : 's'} first.`,
      [act('Continue to manufacturing', { run: 'continue', tone: 'primary' }),
       ...(r.summary.warning ? [act('What should I still fix?', { say: 'What warnings are left and do they matter?' })] : [])])
  }
  const firstCritical = r.results.find(x => x.status === 'critical')
  const actions = sizeChartActions(ctx)
  return msg(
    `Your files scored **${r.score}/100**. ${r.summary.critical} item${r.summary.critical === 1 ? '' : 's'} block production${firstCritical ? ` — the key one is **${firstCritical.label.toLowerCase()}**. ${firstCritical.detail}` : '.'} Nothing here is a dead end; I can generate what’s missing.`,
    actions.length ? actions : [
      act('Fix the critical items', { say: 'Walk me through fixing the critical issues', tone: 'primary' }),
      act('Why does this matter?', { say: `Why does ${firstCritical?.label ?? 'this'} matter for production?` }), TALK,
    ])
}

// Special-cased because the brief calls it out explicitly.
function sizeChartActions(ctx: AssistantContext): QuickAction[] {
  const needsSize = (ctx.prepressReport?.results ?? []).some(r => r.id === 'size-chart' && r.status !== 'pass')
  if (!needsSize) return []
  return [
    act('Create Size Spec', { run: 'create-size-spec', tone: 'primary' }),
    act('Upload Size Chart', { run: 'upload-size-chart' }),
    act('Use Standard Fit', { run: 'use-standard-fit' }),
  ]
}

function techpackGreet(ctx: AssistantContext): AssistantMessage {
  const missing = ctx.missingItems ?? []
  if (missing.length) {
    return msg(`A complete tech pack needs measurements, colors, placement, fabric, and decoration. Still missing: **${missing.join(', ')}**. I can fill these in with you.`,
      [act('Complete my tech pack', { say: 'Help me complete the missing tech pack details', tone: 'primary' }), TALK])
  }
  return msg('Let’s make sure your tech pack is production-ready: graded measurements, colors, placement specs, fabric, and decoration method. I can review what’s there and flag any gaps before it reaches a supplier.',
    [act('Review my tech pack', { say: 'Check whether my tech pack is missing manufacturing details', tone: 'primary' }), TALK])
}

// ── Follow-up replies ──────────────────────────────────────────────────────────
export function reply(ctx: AssistantContext, text: string): AssistantMessage {
  const t = text.toLowerCase()

  if (/which path|choose|right for me|where.*start/.test(t))
    return msg('Quick rule of thumb: **Upload Production Files** if your artwork is finished and you just need manufacturing; **Design Studio** if you want to create it yourself with AI; **Creative Direction** if you’d like our team to do it for you.',
      [act('Upload my files', { run: 'goto-upload' }), act('Open the Studio', { run: 'goto-studio' })])

  if (/logo prompt|better prompt|prompt/.test(t))
    return msg('Strong prompts name four things: **subject**, **style**, **era/mood**, and **usage**. Example: “Minimal wordmark for a streetwear label, 1990s collegiate athletics feel, bold condensed serif, works in one color.” Tell me your brand and I’ll draft one.',
      [act('Draft one for me', { say: 'Draft a logo prompt for a premium minimalist streetwear brand' })])

  if (/placement|where.*place|position/.test(t))
    return msg('For a standard chest print: center it, ~4.5″ below the collar seam, 10–11″ wide for adult sizes. Left-chest logos sit ~4″ from center, 3–4″ wide. Oversized prints run larger and lower. Want me to add these as placement specs?',
      [act('Add placement specs', { run: 'generate-placement' })])

  if (/decoration|print method|screen|embroider|dtg/.test(t))
    return msg('Rule of thumb: **screen print** for bold, few-color graphics at volume; **DTG** for photographic or full-color, lower runs; **embroidery** for logos on heavyweight fabric and a premium feel. I can recommend one from your artwork.',
      [act('Recommend for my design', { run: 'specify-decoration' })])

  if (/size chart|sizing|measurement|standard fit/.test(t))
    return msg('A size chart gives the factory graded measurements so every unit is consistent — without it, fit is a guess. You have three options: I can **generate a graded spec** from a standard block, you can **upload your own**, or we can **use our standard fit** for your garment.',
      sizeChartActions(ctx).length ? sizeChartActions(ctx) : [act('Generate a size spec', { run: 'create-size-spec' })])

  if (/cmyk|rgb|color mode/.test(t))
    return msg('Screens are RGB; presses are CMYK. Converting now prevents colors from shifting in print. I can convert your files and flag any colors that won’t reproduce cleanly.',
      [act('Convert to CMYK', { run: 'convert-cmyk' })])

  if (/pantone|spot color/.test(t))
    return msg('Pantone references lock exact colors across every production run. I can map your artwork to the nearest Pantone spot colors and add them to the spec.',
      [act('Map to Pantone', { run: 'convert-pantone' })])

  if (/sample|deposit|production.*pay|pay.*production/.test(t))
    return msg('A **sample order** is one finished piece so you can approve fit, fabric, and print before committing — low cost, high confidence. A **production deposit** starts your full run once you’re happy. Most brands sample first, then deposit.',
      [act('Start a sample', { run: 'start-sample' }), act('Start production', { run: 'start-production' })])

  if (/tech ?pack|manufacturing detail|required detail|missing.*(detail|spec)/.test(t))
    return msg('A production-ready tech pack includes: **graded measurements**, **colors / Pantone**, **graphic placement specs**, **fabric composition & weight**, **decoration method**, and **care/label info**. Tell me which you’re unsure about and I’ll help fill it in.',
      [act('Generate placement specs', { run: 'generate-placement' }), act('Recommend decoration', { run: 'specify-decoration' }), TALK])

  if (/next|stage|what happens|status/.test(t))
    return msg(stageNarrative(ctx), [TALK])

  if (/brief|include/.test(t))
    return msg('A great brief covers: the **garment**, your **brand/logo**, **colors**, **quantities & sizes**, **decoration method**, **timeline**, and any **references**. Share what you have — we’ll fill the gaps.',
      [TALK])

  if (/talk|human|team|help|escalate/.test(t))
    return msg('Of course — I’ll connect you with the GRACE production team. They’ll have full context on where you are. Want me to include a note?', [TALK])

  // Fallback — stay useful and production-aware.
  return msg('Here’s what I’d focus on next: resolve anything marked critical, confirm your sizing and placement, then move to your tech pack. Tell me which part you’d like to go deeper on, or I can connect you with the team.',
    [act('What’s blocking me?', { say: 'What is blocking my project right now?' }), TALK])
}

function stageNarrative(ctx: AssistantContext): string {
  if (ctx.pathType === 'orders')
    return `Your order moves through: deposit → sampling → your approval → production → quality check → shipping. ${ctx.currentStage ? `You’re at **${ctx.currentStage}** now.` : ''} I’ll flag the moment something needs your sign-off.`
  return 'Next up: finalize your design, complete the tech pack, then choose a sample or production order. I’ll guide each step.'
}

const shortId = (s: string) => s.slice(0, 8).toUpperCase()
