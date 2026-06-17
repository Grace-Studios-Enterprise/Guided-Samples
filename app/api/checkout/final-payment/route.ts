import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getRouteUser } from '@/lib/supabase-server'
import { clampQuantity, bulkSubtotalCents, finalBalanceCents, productionPriceCents } from '@/lib/pricing'

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const { user } = await getRouteUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { order_id } = await req.json()

  // Use service-role so cross-session orders are found by email fallback
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  const sb = sbUrl && sbKey
    ? createClient(sbUrl, sbKey, { auth: { persistSession: false } })
    : null
  if (!sb) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

  const { data: order, error: orderError } = await sb
    .from('production_orders')
    .select('id, user_id, production_stage, deposit_amount_cents, garment_price_cents, extra_logo_fee_cents, production_quantity, tech_pack_snapshot')
    .eq('id', order_id)
    .or(`user_id.eq.${user.id},user_email.eq.${user.email ?? ''}`)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.production_stage !== 'AWAITING_FINAL_PAYMENT') {
    return NextResponse.json({ error: 'Order is not awaiting final payment' }, { status: 422 })
  }

  // Infer garment price from tech_pack_snapshot if missing
  let unitPrice: number = order.garment_price_cents ?? 0
  if (!unitPrice) {
    const snap = order.tech_pack_snapshot as Record<string, unknown> | null
    const garmentType = (snap?.style_info as Record<string,string> | null)?.garmentType ?? ''
    unitPrice = productionPriceCents(garmentType)
    await sb.from('production_orders').update({ garment_price_cents: unitPrice }).eq('id', order_id)
  }

  const qty = clampQuantity(order.production_quantity ?? 1)
  const subtotal = bulkSubtotalCents(unitPrice, order.extra_logo_fee_cents ?? 0, qty)
  const finalAmount = subtotal > 0
    ? finalBalanceCents(subtotal)
    : (order.deposit_amount_cents ?? 0)

  const stripe = new Stripe(secretKey)
  const origin = req.headers.get('origin') ?? 'http://localhost:3000'

  const stripeSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Final Payment — Remaining Balance',
            description: 'Remaining 50% balance to release shipment',
          },
          unit_amount: finalAmount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      payment_type: 'final_payment',
      order_id,
      user_id: user.id,
    },
    success_url: `${origin}/track?payment=final_success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/track`,
  })

  return NextResponse.json({ url: stripeSession.url })
}
