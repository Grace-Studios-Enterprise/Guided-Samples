import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { garmentType, garmentColor, logoStyle, logoColor, placement } = await req.json()

  const type = garmentType || 'hoodie'
  const color = garmentColor || 'black'
  const style = logoStyle || 'minimal'
  const logoCol = logoColor || 'forest green'
  const place = placement || 'center chest'

  const prompt = `Professional apparel product photography of a ${color} ${type} with a ${style} logo in ${logoCol} printed at the ${place}. Studio lighting, clean white background, product shot, high-end fashion brand quality, realistic fabric texture, no model, photorealistic.`

  if (process.env.OPENAI_API_KEY) {
    try {
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

      const data = await res.json()
      const images = (data.data as { b64_json: string }[]).map(
        d => `data:image/png;base64,${d.b64_json}`
      )
      return NextResponse.json({ source: 'openai', images })
    } catch (err) {
      console.error('Preview generation failed:', err)
      return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'No API key configured' }, { status: 500 })
}
