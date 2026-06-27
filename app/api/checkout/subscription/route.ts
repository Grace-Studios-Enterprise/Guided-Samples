import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getRouteUser } from '@/lib/supabase-server'
import { tierPriceId, isValidTier } from '@/lib/tiers'
import { linkStripeCustomer } from '@/lib/aiCredits'

// Start a Designer ($19/mo) or Brand ($79/mo) membership via Stripe Checkout
// (recurring). The webhook activates the tier on checkout.session.completed and
// keeps it in sync via customer.subscription.* events.
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

  const { user } = await getRouteUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tier } = await req.json().catch(() => ({}))
  if (!isValidTier(tier) || tier === 'free') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const priceId = tierPriceId(tier)
  if (!priceId) {
    return NextResponse.json(
      { error: 'This plan isn’t available yet — Stripe price isn’t configured.' },
      { status: 503 },
    )
  }

  const stripe = new Stripe(secretKey)
  const origin = req.headers.get('origin') ?? 'http://localhost:3000'

  // Reuse an existing Stripe customer for this email, else create one.
  let customerId: string | undefined
  if (user.email) {
    const found = await stripe.customers.list({ email: user.email, limit: 1 })
    customerId = found.data[0]?.id
  }
  if (!customerId) {
    const c = await stripe.customers.create({ email: user.email ?? undefined, metadata: { user_id: user.id } })
    customerId = c.id
  }
  await linkStripeCustomer(user.id, customerId)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { payment_type: 'subscription', user_id: user.id, tier },
    subscription_data: { metadata: { user_id: user.id, tier } },
    success_url: `${origin}/?view=studio&subscribed=${tier}`,
    cancel_url: `${origin}/?view=studio`,
  })

  return NextResponse.json({ url: session.url })
}
