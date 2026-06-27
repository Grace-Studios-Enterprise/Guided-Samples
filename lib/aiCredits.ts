/**
 * AI credit system — server-side functions only.
 * Import this only in Next.js API routes and webhooks (Node.js runtime).
 */

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { isValidTier, tierPerks, type Tier } from './tiers'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Free generations granted to every Free-tier user before they must subscribe. */
export const FREE_GENERATION_LIMIT = 3

export type UserCredits = {
  user_id: string
  free_generations_used: number
  ai_credit_balance: number
  ai_spend_cents: number
  tier?: Tier
}

// ── Service-role client ────────────────────────────────────────────────────────

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── Core functions ─────────────────────────────────────────────────────────────

/** Fetch a user's credit record. Returns null if no record exists yet. */
export async function fetchCredits(userId: string): Promise<UserCredits | null> {
  const sb = serviceClient()
  if (!sb) return null
  const { data } = await sb
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single()
  return (data as UserCredits) ?? null
}

/** Return true if the project is associated with an active unlimited-AI production order. */
async function projectHasUnlimited(projectId: string): Promise<boolean> {
  const sb = serviceClient()
  if (!sb) return false
  const { data } = await sb
    .from('production_orders')
    .select('id')
    .eq('unlimited_ai_project_id', projectId)
    .limit(1)
  return !!data?.length
}

/**
 * Check whether the caller may generate and, if so, consume one credit.
 * - Authenticated users are enforced via the database.
 * - Anonymous users are enforced via a request header (soft gate, client-managed).
 */
export async function checkAndConsume(
  req: NextRequest,
  userId?: string,
  projectId?: string,
): Promise<{ allowed: boolean; reason?: string }> {
  // ── Anonymous ────────────────────────────────────────────────────────────
  if (!userId) {
    const freeUsed = parseInt(req.headers.get('x-ai-free-used') ?? '0', 10)
    if (freeUsed >= FREE_GENERATION_LIMIT) {
      return { allowed: false, reason: 'PAYWALL' }
    }
    return { allowed: true }
  }

  const sb = serviceClient()
  if (!sb) return { allowed: true } // DB unavailable — don't block

  // ── Get or initialise credits row ────────────────────────────────────────
  let credits = await fetchCredits(userId)
  if (!credits) {
    await sb.from('user_credits').insert({
      user_id: userId,
      free_generations_used: 0,
      ai_credit_balance: 0,
      ai_spend_cents: 0,
    })
    credits = { user_id: userId, free_generations_used: 0, ai_credit_balance: 0, ai_spend_cents: 0 }
  }

  // ── Subscriber (Designer / Brand) → unlimited AI ──────────────────────────
  const tier: Tier = isValidTier(credits.tier) ? credits.tier : 'free'
  if (tierPerks(tier).unlimitedAI) {
    await logTransaction(sb, userId, 'credit_usage', 0, 0, 0, projectId, `unlimited_${tier}`)
    return { allowed: true }
  }

  // ── Project unlimited (legacy: a paid production order on this project) ────
  if (projectId) {
    const unlimited = await projectHasUnlimited(projectId)
    if (unlimited) {
      await logTransaction(sb, userId, 'credit_usage', 0, 0, 0, projectId, 'unlimited_project')
      return { allowed: true }
    }
  }

  // ── Free generation ──────────────────────────────────────────────────────
  if (credits.free_generations_used < FREE_GENERATION_LIMIT) {
    await sb
      .from('user_credits')
      .update({
        free_generations_used: credits.free_generations_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
    await logTransaction(sb, userId, 'free_usage', 0, 0, 1, projectId)
    return { allowed: true }
  }

  // ── Paid credit ──────────────────────────────────────────────────────────
  if (credits.ai_credit_balance > 0) {
    await sb
      .from('user_credits')
      .update({
        ai_credit_balance: credits.ai_credit_balance - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
    await logTransaction(sb, userId, 'credit_usage', 0, 0, 1, projectId)
    return { allowed: true }
  }

  return { allowed: false, reason: 'PAYWALL' }
}

/** Add purchased credits to a user account (called by Stripe webhook). */
export async function addCredits(
  userId: string,
  creditsAdded: number,
  amountCents: number,
  stripeSessionId?: string,
) {
  const sb = serviceClient()
  if (!sb) return

  const existing = await fetchCredits(userId)
  if (existing) {
    await sb
      .from('user_credits')
      .update({
        ai_credit_balance: existing.ai_credit_balance + creditsAdded,
        ai_spend_cents: existing.ai_spend_cents + amountCents,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  } else {
    await sb.from('user_credits').insert({
      user_id: userId,
      free_generations_used: 0,
      ai_credit_balance: creditsAdded,
      ai_spend_cents: amountCents,
    })
  }

  await logTransaction(sb, userId, 'credit_purchase', amountCents, creditsAdded, 0, undefined, stripeSessionId)
}

/** The user's current membership tier (defaults to free). */
export async function getUserTier(userId: string): Promise<Tier> {
  const c = await fetchCredits(userId)
  return isValidTier(c?.tier) ? (c!.tier as Tier) : 'free'
}

/** Persist the Stripe customer id on a user's credits row (at subscribe time). */
export async function linkStripeCustomer(userId: string, stripeCustomerId: string): Promise<void> {
  const sb = serviceClient()
  if (!sb) return
  const existing = await fetchCredits(userId)
  if (!existing) {
    await sb.from('user_credits').insert({
      user_id: userId, free_generations_used: 0, ai_credit_balance: 0, ai_spend_cents: 0,
      stripe_customer_id: stripeCustomerId,
    })
  } else {
    await sb.from('user_credits').update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() }).eq('user_id', userId)
  }
}

/** Find the user linked to a Stripe customer (subscription webhooks). */
export async function userIdForCustomer(stripeCustomerId: string): Promise<string | null> {
  const sb = serviceClient()
  if (!sb) return null
  const { data } = await sb.from('user_credits').select('user_id').eq('stripe_customer_id', stripeCustomerId).single()
  return (data?.user_id as string) ?? null
}

/** Set a user's tier + subscription linkage (called by the subscription webhook). */
export async function setUserSubscription(opts: {
  userId?: string | null
  stripeCustomerId?: string | null
  tier: Tier
  subscriptionId?: string | null
  status?: string | null
  currentPeriodEnd?: string | null
}): Promise<void> {
  const sb = serviceClient()
  if (!sb) return
  const patch: Record<string, unknown> = {
    tier: opts.tier,
    stripe_subscription_id: opts.subscriptionId ?? null,
    subscription_status: opts.status ?? null,
    subscription_current_period_end: opts.currentPeriodEnd ?? null,
    updated_at: new Date().toISOString(),
  }
  if (opts.stripeCustomerId) patch.stripe_customer_id = opts.stripeCustomerId

  if (opts.userId) {
    const existing = await fetchCredits(opts.userId)
    if (!existing) {
      await sb.from('user_credits').insert({ user_id: opts.userId, free_generations_used: 0, ai_credit_balance: 0, ai_spend_cents: 0, ...patch })
    } else {
      await sb.from('user_credits').update(patch).eq('user_id', opts.userId)
    }
  } else if (opts.stripeCustomerId) {
    await sb.from('user_credits').update(patch).eq('stripe_customer_id', opts.stripeCustomerId)
  }
}

/**
 * Enable unlimited AI for the project after activation payment,
 * and record the AI spend amount that was applied to the activation fee.
 */
export async function applyActivationUnlock(
  userId: string,
  projectId: string,
  aiSpendAppliedCents: number,
) {
  const sb = serviceClient()
  if (!sb) return

  await sb
    .from('production_orders')
    .update({
      unlimited_ai_project_id: projectId,
      ai_spend_applied_cents: aiSpendAppliedCents,
    })
    .eq('design_order_id', projectId)
    .eq('user_id', userId)
    .is('unlimited_ai_project_id', null) // only set once

  if (aiSpendAppliedCents > 0) {
    await logTransaction(
      sb, userId, 'activation_credit_applied', aiSpendAppliedCents, 0, 0, projectId,
    )
  }
  await logTransaction(sb, userId, 'activation_unlock', 0, 0, 0, projectId)
}

// ── Internal helpers ───────────────────────────────────────────────────────────

async function logTransaction(
  sb: ReturnType<typeof serviceClient>,
  userId: string,
  type: string,
  amountCents: number,
  creditsAdded: number,
  creditsConsumed: number,
  projectId?: string,
  note?: string,
) {
  if (!sb) return
  await sb.from('ai_transactions').insert({
    user_id: userId,
    type,
    amount_cents: amountCents,
    credits_added: creditsAdded,
    credits_consumed: creditsConsumed,
    project_id: projectId ?? null,
    stripe_session_id: note?.startsWith('cs_') ? note : null,
    note: note && !note.startsWith('cs_') ? note : null,
  })
}
