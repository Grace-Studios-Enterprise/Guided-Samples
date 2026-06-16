import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getRouteUser } from '@/lib/supabase-server'
import { CREDIT_PACKS } from '@/lib/aiCredits'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const { sb, user } = await getRouteUser(req)
  if (!sb || !user) {
    return NextResponse.json({ error: 'Unauthorized — sign in to purchase AI credits' }, { status: 401 })
  }

  const { pack_id } = await req.json()
  const pack = CREDIT_PACKS.find(p => p.id === pack_id)
  if (!pack) {
    return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 })
  }

  const stripe = new Stripe(secretKey)
  const origin = req.headers.get('origin') ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `GRACE AI Credits — ${pack.label}`,
            description: `${pack.generations} AI generations. Never expire. Apply toward your $25 production activation fee.`,
          },
          unit_amount: pack.price_cents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      payment_type: 'credit_purchase',
      user_id: user.id,
      pack_id: pack.id,
      credits: String(pack.generations),
      amount_cents: String(pack.price_cents),
    },
    success_url: `${origin}/?view=studio&credits_added=${pack.generations}`,
    cancel_url: `${origin}/?view=studio`,
  })

  return NextResponse.json({ url: session.url })
}
