import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

// GRACE Assistant — a context-aware production concierge. It answers ONLY from
// the grounding (real project data assembled client-side) plus general apparel
// knowledge, and never invents project-specific facts. If the model/key is
// unavailable it returns ok:false and the client falls back to the deterministic
// advisor, so the assistant always responds.

const SYSTEM = `You are the GRACE Assistant — an AI production concierge for an apparel design-to-manufacturing platform.

TONE: calm, premium, clear, production-aware, helpful, never overly technical. 2–5 sentences. Plain English.

GROUNDING RULES (critical):
- You are given CONTEXT (JSON) describing the user's current path, project/design state, uploaded files, the prepress production-readiness report, and any saved size profiles.
- Answer using the CONTEXT and general apparel-production knowledge ONLY.
- NEVER invent project-specific facts (measurements, order status, file contents, prices, dates). If the user asks for something not present in CONTEXT, say plainly that it isn't available yet, and tell them how to add it (e.g. upload a size chart, create a size profile, run a preflight, generate a tech pack) or offer to connect them with the GRACE team.
- When something is missing or blocking, explain WHAT is missing, WHY it matters, and the next best action.
- If size questions are asked and a size profile exists in CONTEXT, you may quote those exact numbers. If none exists, say so — do not fabricate measurements.
- You guide only; you cannot place orders or take payments. Never claim to have done so.`

interface Body {
  message?: string
  history?: { role: 'user' | 'assistant'; text: string }[]
  grounding?: unknown
}

export async function POST(req: NextRequest) {
  const { message, history = [], grounding = {} }: Body = await req.json().catch(() => ({}))
  if (!message || !message.trim()) return NextResponse.json({ ok: false, reason: 'Empty message.' }, { status: 400 })
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ ok: false, reason: 'AI assistant not configured.' })

  const messages = [
    { role: 'system', content: SYSTEM },
    { role: 'system', content: `CONTEXT (the only project facts you may use):\n${JSON.stringify(grounding).slice(0, 8000)}` },
    ...history.slice(-8).map(m => ({ role: m.role, content: m.text })),
    { role: 'user', content: message.slice(0, 2000) },
  ]

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o', temperature: 0.3, max_tokens: 450, messages }),
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ ok: false, reason: `Assistant service error (${res.status}).`, detail: text.slice(0, 200) })
    }
    const data = await res.json()
    const text: string = data?.choices?.[0]?.message?.content?.trim() ?? ''
    if (!text) return NextResponse.json({ ok: false, reason: 'No response generated.' })
    return NextResponse.json({ ok: true, text })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: 'Assistant request failed.', detail: String(e).slice(0, 200) })
  }
}
