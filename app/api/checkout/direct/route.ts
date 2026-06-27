import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getRouteUser } from '@/lib/supabase-server'
import {
  EXTRA_LOGO_FEE_CENTS,
  MIN_PRODUCTION_QUANTITY,
  productionPriceCents,
  clampQuantity,
  bulkSubtotalCents,
  depositCents,
  setupFeeCentsFor,
  applyTierDiscount,
} from '@/lib/pricing'
import { normalizeBreakdown, sumBreakdown } from '@/lib/sizes'
import { getUserTier } from '@/lib/aiCredits'

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const { sb, user } = await getRouteUser(req)
  if (!sb) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { design_order_id, garment_type, is_uniform, is_reversible, style_name, extra_logos, quantity, size_breakdown, notes } = await req.json()

  if (!garment_type) {
    return NextResponse.json({ error: 'garment_type is required' }, { status: 400 })
  }

  const garmentPrice = productionPriceCents(garment_type, !!is_uniform, !!is_reversible)
  const extraLogoCount = Number(extra_logos ?? 0)
  const extraLogoFee = extraLogoCount * EXTRA_LOGO_FEE_CENTS

  // Quantity is derived from the size breakdown when provided; otherwise fall
  // back to a flat quantity. Bulk runs must meet the MOQ.
  const breakdown = normalizeBreakdown(size_breakdown)
  const breakdownTotal = sumBreakdown(breakdown)
  const qty = clampQuantity(breakdownTotal > 0 ? breakdownTotal : (quantity ?? MIN_PRODUCTION_QUANTITY))
  if (qty < MIN_PRODUCTION_QUANTITY) {
    return NextResponse.json(
      { error: `Minimum order quantity is ${MIN_PRODUCTION_QUANTITY} pieces` },
      { status: 422 },
    )
  }
  // Membership tier: subscribers' setup fee is waived; Brand gets 5% off production.
  const tier = await getUserTier(user.id)
  const subtotal = applyTierDiscount(bulkSubtotalCents(garmentPrice, extraLogoFee, qty), tier)
  const depositAmount = depositCents(subtotal)
  const activationDueCents = setupFeeCentsFor(tier)

  const stripe = new Stripe(secretKey)
  const origin = req.headers.get('origin') ?? 'http://localhost:3000'

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

  if (activationDueCents > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'GRACE Order Setup Fee',
          description: 'One-time setup per production order (waived on Designer & Brand plans)',
        },
        unit_amount: activationDueCents,
      },
      quantity: 1,
    })
  }

  lineItems.push({
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
  })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    metadata: {
      payment_type: 'direct_deposit',
      design_order_id: design_order_id ?? '',
      user_id: user.id,
      garment_type,
      is_uniform: String(!!is_uniform),
      is_reversible: String(!!is_reversible),
      style_name: style_name ?? '',
      extra_logos: String(extraLogoCount),
      quantity: String(qty),
      size_breakdown: JSON.stringify(breakdown),
      notes: notes ?? '',
      tier,
    },
    success_url: `${origin}/track?payment=direct_success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/track`,
  })

  return NextResponse.json({ url: session.url })
}
