import { NextRequest, NextResponse } from 'next/server'
import { getRouteUser } from '@/lib/supabase-server'
import { FREE_GENERATION_LIMIT } from '@/lib/aiCredits'

export const runtime = 'nodejs'

/** GET /api/ai-usage — return the current user's credit state. */
export async function GET(req: NextRequest) {
  const { sb, user } = await getRouteUser(req)
  if (!sb || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await sb
    .from('user_credits')
    .select('free_generations_used, ai_credit_balance, ai_spend_cents')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json(
    data ?? { free_generations_used: 0, ai_credit_balance: 0, ai_spend_cents: 0, free_limit: FREE_GENERATION_LIMIT },
  )
}
