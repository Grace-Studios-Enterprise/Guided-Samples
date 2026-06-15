import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { ACTIVATION_FEE_CENTS, EXTRA_LOGO_FEE_CENTS, samplePriceCents } from '@/lib/pricing'

const ACTIVATION_FEE = ACTIVATION_FEE_CENTS

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const stripe = new Stripe(secretKey)
  const { garmentType, styleName, extraLogos, notes } = await req.json()

  const garmentPrice = samplePriceCents(garmentType)
  const garmentLabel = garmentType || 'Custom Garment'
  const origin = req.headers.get('origin') ?? 'http://localhost:3000'

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'GRACE Order Activation Fee',
          description: 'One-time activation per production order',
        },
        unit_amount: ACTIVATION_FEE,
      },
      quantity: 1,
    },
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${garmentLabel} Sample`,
          description: styleName ? `Style: ${styleName}` : 'Single sample production',
        },
        unit_amount: garmentPrice,
      },
      quantity: 1,
    },
  ]

  if (extraLogos > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Additional Logo Placement',
          description: `${extraLogos} additional logo location${extraLogos > 1 ? 's' : ''} at $4 each`,
        },
        unit_amount: EXTRA_LOGO_FEE_CENTS,
      },
      quantity: extraLogos,
    })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    metadata: {
      garmentType: garmentLabel,
      styleName: styleName ?? '',
      notes: notes ?? '',
    },
    success_url: `${origin}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}?payment=cancelled`,
  })

  return NextResponse.json({ url: session.url })
}
