import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getRouteUser } from '@/lib/supabase-server'
import {
  EXTRA_LOGO_FEE_CENTS,
  productionPriceCents,
  clampQuantity,
  bulkSubtotalCents,
  depositCents,
} from '@/lib/pricing'

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const { sb, user } = await getRouteUser(req)
  if (!sb) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { design_order_id, garment_type, style_name, extra_logos, quantity, notes } = await req.json()

  if (!garment_type) {
    return NextResponse.json({ error: 'garment_type is required' }, { status: 400 })
  }

  const garmentPrice = productionPriceCents(garment_type)
  const extraLogoCount = Number(extra_logos ?? 0)
  const extraLogoFee = extraLogoCount * EXTRA_LOGO_FEE_CENTS
  const qty = clampQuantity(quantity ?? 1)
  const subtotal = bulkSubtotalCents(garmentPrice, extraLogoFee, qty)
  const depositAmount = depositCents(subtotal)

  const stripe = new Stripe(secretKey)
  const origin = req.headers.get('origin') ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Production Deposit — 50% of $${(subtotal / 100).toFixed(2)}`,
            description: style_name
              ? `${garment_type} · ${qty} pcs · Style: ${style_name}`
              : `${garment_type} · ${qty} pcs`,
          },
          unit_amount: depositAmount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      payment_type: 'direct_deposit',
      design_order_id: design_order_id ?? '',
      user_id: user.id,
      garment_type,
      style_name: style_name ?? '',
      extra_logos: String(extraLogoCount),
      quantity: String(qty),
      notes: notes ?? '',
    },
    success_url: `${origin}/track?payment=direct_success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/track`,
  })

  return NextResponse.json({ url: session.url })
}
