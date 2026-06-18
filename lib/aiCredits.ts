/**
 * AI credit system — server-side functions only.
 * Import this only in Next.js API routes and webhooks (Node.js runtime).
 */

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Total free generations granted to every new user (3 logo + 3 garment + 3 edit). */
export const FREE_GENERATION_LIMIT = 3

export const CREDIT_PACKS = [
  { id: 'pack_25',  generations: 25,  price_cents: 900,  label: '25 Generations', price_label: '$9' },
  { id: 'pack_60',  generations: 60,  price_cents: 1900, label: '60 Generations', price_label: '$19' },
  { id: 'pack_150', generations: 150, price_cents: 3900, label: '150 Generations', price_label: '$39' },
] as const

export type CreditPack = typeof CREDIT_PACKS[number]

export type UserCredits = {
  user_id: string
  free_generations_used: number
  ai_credit_balance: number
  ai_spend_cents: number
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

  // ── Project unlimited ────────────────────────────────────────────────────
  if (projectId) {
    const unlimited = await projectHasUnlimited(projectId)
    if (unlimited) {
      await logTransaction(sb, userId, 'credit_usage', 0, 0, 0, projectId, 'unlimited_project')
      return { allowed: true }
    }
  }

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

/**
 * Compute the activation fee discount from prior AI credit spend.
 * Up to $25 of previous credit purchases offsets the activation fee.
 * Any spend above $25 stays as usable AI credits.
 */
export async function getActivationOffset(userId: string): Promise<{
  offsetCents: number
  message?: string
}> {
  const credits = await fetchCredits(userId)
  if (!credits || credits.ai_spend_cents === 0) {
    return { offsetCents: 0 }
  }
  const ACTIVATION = 2500
  const offsetCents = Math.min(ACTIVATION, credits.ai_spend_cents)
  return {
    offsetCents,
    message: `Your previous AI purchases have been applied toward activation.`,
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
