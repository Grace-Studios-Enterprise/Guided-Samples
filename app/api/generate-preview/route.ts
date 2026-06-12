import { NextRequest } from 'next/server'
import { previewPrompt } from '@/lib/prompts'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { garmentType, garmentColor, logoStyle, logoColor, placement } = await req.json()

  const params = {
    garmentType: garmentType || 'hoodie',
    garmentColor: garmentColor || 'black',
    logoStyle: logoStyle || 'minimal',
    logoColor: logoColor || 'forest green',
    placement: placement || 'center chest',
  }

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const enc = new TextEncoder()
  const send = (data: object) => writer.write(enc.encode(`data: ${JSON.stringify(data)}\n\n`))

  ;(async () => {
    try {
      await send({ type: 'status', message: 'Connecting to AI...' })

      if (!process.env.OPENAI_API_KEY) {
        await send({ type: 'error', message: 'No API key configured.' })
        return
      }

      await send({ type: 'status', message: 'Generating realistic preview...' })
      const prompt = previewPrompt(params)

      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt,
          n: 2,
          size: '1024x1024',
          output_format: 'png',
          quality: 'medium',
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`OpenAI ${res.status}: ${text}`)
      }

      await send({ type: 'status', message: 'Processing images...' })
      const data = await res.json()
      const images = (data.data as { b64_json: string }[]).map(d => `data:image/png;base64,${d.b64_json}`)
      await send({ type: 'complete', source: 'openai', images })
    } catch (err) {
      console.error('Preview generation failed:', err)
      await send({ type: 'error', message: 'Generation failed. Please try again.' })
    } finally {
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}
