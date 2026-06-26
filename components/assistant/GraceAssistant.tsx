'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Sparkles, X, ArrowUp, Headset } from 'lucide-react'
import { useAssistant } from './AssistantProvider'
import { greet, reply } from '@/lib/assistant/advisor'
import { runAction } from '@/lib/assistant/actions'
import { buildGrounding } from '@/lib/assistant/grounding'
import { downloadTextFile } from '@/lib/prepress/sizeSpec'
import type { AssistantMessage, QuickAction } from '@/lib/assistant/types'

const PATH_LABEL: Record<string, string> = {
  landing: 'Getting started', creative: 'Creative Direction', studio: 'Design Studio',
  upload: 'Production Review', techpack: 'Tech Pack', checkout: 'Checkout', orders: 'Order Status',
}

let uid = 0
const userMsg = (text: string): AssistantMessage => ({ id: `u${++uid}`, role: 'user', text })

export default function GraceAssistant() {
  const { context, onAction } = useAssistant()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Re-greet whenever the meaningful context changes (path, stage, prepress result).
  const contextKey = useMemo(
    () => `${context.pathType}:${context.currentStage ?? ''}:${context.prepressReport?.score ?? ''}:${context.prepressReport?.ready ?? ''}`,
    [context.pathType, context.currentStage, context.prepressReport?.score, context.prepressReport?.ready],
  )
  useEffect(() => { setMessages([greet(context)]) }, [contextKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  function push(...m: AssistantMessage[]) { setMessages(prev => [...prev, ...m]) }

  // Ask the real, grounded AI. Falls back to the deterministic advisor if the
  // route is unavailable, so the assistant always responds. `display` lets a
  // quick-action button show its label while sending its underlying question.
  async function ask(query: string, display = query) {
    const clean = query.trim()
    if (!clean || typing) return
    push(userMsg(display))
    setTyping(true)
    const history = messages.slice(-8).map(m => ({ role: m.role, text: m.text }))
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: clean, history, grounding: buildGrounding(context) }),
      })
      const json = await res.json().catch(() => ({ ok: false }))
      if (json?.ok && json.text) {
        // AI prose, grounded in real data, plus real contextual action buttons.
        push({ id: `a${++uid}`, role: 'assistant', text: json.text, actions: reply(context, clean).actions })
      } else {
        push(reply(context, clean)) // graceful degrade
      }
    } catch {
      push(reply(context, clean))
    } finally {
      setTyping(false)
    }
  }

  function send(text: string) {
    if (!text.trim()) return
    setDraft('')
    ask(text)
  }

  function handleAction(a: QuickAction) {
    if (a.say) { ask(a.say, a.label); return }
    if (a.run) {
      push(userMsg(a.label))
      if (onAction?.(a.run)) { push({ id: `a${++uid}`, role: 'assistant', text: 'On it — taking you there. I’ll be right here if you need anything.' }); return }
      const res = runAction(a.run, context)
      if (res.download) downloadTextFile(res.download.filename, res.download.content, res.download.mime)
      push({ id: `a${++uid}`, role: 'assistant', text: res.text, actions: res.actions })
    }
  }

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-grace-ink text-white pl-3 pr-4 py-2.5 shadow-lg hover:bg-zinc-800 transition-colors"
          aria-label="Open GRACE Assistant"
        >
          <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center"><Sparkles size={13}/></span>
          <span className="text-xs font-semibold tracking-wide">Assistant</span>
        </button>
      )}

      {/* Drawer */}
      {open && (
        <div className="fixed bottom-5 right-5 z-[60] w-[380px] max-w-[calc(100vw-1.5rem)] h-[560px] max-h-[calc(100vh-2.5rem)] rounded-2xl border border-grace-border bg-white shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-grace-border bg-white">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-grace-ink text-white flex items-center justify-center"><Sparkles size={15}/></span>
              <div>
                <p className="text-sm font-bold text-grace-ink leading-none">GRACE Assistant</p>
                <p className="text-[10px] text-grace-stone mt-0.5 tracking-wide">{PATH_LABEL[context.pathType] ?? 'Production concierge'}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-grace-stone hover:text-grace-ink hover:bg-grace-mist transition-colors" aria-label="Close">
              <X size={16}/>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map(m => (
              <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
                {m.role === 'user' ? (
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-grace-ink text-white text-[13px] leading-relaxed px-3.5 py-2">{m.text}</div>
                ) : (
                  <div className="max-w-[92%]">
                    <p className="text-[13px] leading-relaxed text-grace-ink whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMd(m.text) }} />
                    {m.actions?.length ? (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {m.actions.map(a => (
                          <button key={a.id} onClick={() => handleAction(a)}
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-3 py-1.5 border transition-colors ${
                              a.tone === 'primary'
                                ? 'bg-grace-ink text-white border-grace-ink hover:bg-zinc-800'
                                : a.run === 'escalate'
                                ? 'bg-white text-grace-stone border-grace-border hover:text-grace-ink'
                                : 'bg-grace-mist text-grace-ink border-grace-border hover:bg-grace-ink hover:text-white'
                            }`}>
                            {a.run === 'escalate' && <Headset size={11}/>}
                            {a.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div className="flex items-center gap-1.5 text-grace-stone">
                <span className="w-1.5 h-1.5 rounded-full bg-grace-stone/60 animate-bounce" style={{ animationDelay: '0ms' }}/>
                <span className="w-1.5 h-1.5 rounded-full bg-grace-stone/60 animate-bounce" style={{ animationDelay: '120ms' }}/>
                <span className="w-1.5 h-1.5 rounded-full bg-grace-stone/60 animate-bounce" style={{ animationDelay: '240ms' }}/>
                <span className="text-[11px] ml-1">GRACE is thinking…</span>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-grace-border p-2.5">
            <div className="flex items-end gap-2 rounded-xl border border-grace-border bg-grace-mist px-3 py-2 focus-within:border-grace-ink transition-colors">
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(draft) } }}
                rows={1}
                placeholder="Ask GRACE anything about your project…"
                className="flex-1 bg-transparent resize-none text-[13px] text-grace-ink placeholder:text-grace-stone/60 focus:outline-none max-h-24"
              />
              <button onClick={() => send(draft)} disabled={!draft.trim() || typing}
                className="w-7 h-7 rounded-lg bg-grace-ink text-white flex items-center justify-center disabled:opacity-30 hover:bg-zinc-800 transition-colors shrink-0"
                aria-label="Send">
                <ArrowUp size={15}/>
              </button>
            </div>
            <p className="text-[9px] text-grace-stone/60 text-center mt-1.5 tracking-wide">GRACE Assistant guides you — it can’t place orders or payments.</p>
          </div>
        </div>
      )}
    </>
  )
}

// Tiny markdown: **bold** only (kept deliberately minimal & safe).
function renderMd(text: string): string {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}
