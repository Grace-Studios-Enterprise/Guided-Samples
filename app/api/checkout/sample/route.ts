import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getRouteUser } from '@/lib/supabase-server'
import { EXTRA_LOGO_FEE_CENTS, samplePriceCents, setupFeeCentsFor, applyTierDiscount } from '@/lib/pricing'
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

  const { design_order_id, garment_type, is_uniform, is_reversible, style_name, extra_logos, size_breakdown, notes } = await req.json()

  const { data: project, error: projectError } = await sb
    .from('projects')
    .select('id, user_id, phase_reached')
    .eq('id', design_order_id)
    .eq('user_id', user.id)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if ((project.phase_reached ?? 0) < 5) {
    return NextResponse.json({ error: 'Project not ready for production' }, { status: 422 })
  }

  const stripe = new Stripe(secretKey)
  const origin = req.headers.get('origin') ?? 'http://localhost:3000'
  const extraLogosCount = Number(extra_logos) || 0

  const breakdown = normalizeBreakdown(size_breakdown)
  const sampleCount = Math.max(1, sumBreakdown(breakdown))

  // Membership tier: subscribers' setup fee is waived; Brand gets 5% off production.
  const tier = await getUserTier(user.id)
  const activationDueCents = setupFeeCentsFor(tier)
  const sampleUnit = applyTierDiscount(samplePriceCents(garment_type, !!is_uniform, !!is_reversible), tier)
  const extraLogoUnit = applyTierDiscount(EXTRA_LOGO_FEE_CENTS, tier)

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
        name: `${garment_type} Sample`,
        description: style_name ? `Style: ${style_name}` : 'Sample production',
      },
      unit_amount: sampleUnit,
    },
    quantity: sampleCount,
  })

  if (extraLogosCount > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Additional Logo Placement',
          description: `${extraLogosCount} additional logo location${extraLogosCount > 1 ? 's' : ''} at $4 each`,
        },
        unit_amount: extraLogoUnit,
      },
      quantity: extraLogosCount * sampleCount,
    })
  }

  const stripeSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    metadata: {
      payment_type: 'sample',
      design_order_id,
      user_id: user.id,
      garment_type,
      is_uniform: String(!!is_uniform),
      is_reversible: String(!!is_reversible),
      style_name: style_name ?? '',
      extra_logos: String(extraLogosCount),
      size_breakdown: JSON.stringify(breakdown),
      notes: notes ?? '',
      tier,
    },
    success_url: `${origin}/track?payment=sample_success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/track?payment=cancelled`,
  })

  return NextResponse.json({ url: stripeSession.url })
}
