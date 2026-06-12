// Streaming SSE client for generation endpoints.
// Calls onStatus for each status event, returns the complete payload.

type SSEEvent =
  | { type: 'status'; message: string }
  | { type: 'complete'; [key: string]: unknown }
  | { type: 'error'; message: string }

export async function streamGenerate<T>(
  url: string,
  body: unknown,
  onStatus: (msg: string) => void,
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.body) throw new Error('No response body from server')

  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      let event: SSEEvent
      try { event = JSON.parse(line.slice(6)) } catch { continue }
      if (event.type === 'status') onStatus(event.message)
      if (event.type === 'complete') return event as unknown as T
      if (event.type === 'error') throw new Error(event.message)
    }
  }
  throw new Error('Stream ended without a completion event')
}
