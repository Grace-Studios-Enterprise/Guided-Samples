import { NextRequest, NextResponse } from 'next/server'
import { getRouteUser } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

// Returns the authenticated user's production orders using service-role,
// so the response is not affected by RLS policy misconfigurations.
export async function GET(req: NextRequest) {
  const { user } = await getRouteUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const sb = createClient(url, key, { auth: { persistSession: false } })
  const { data, error } = await sb
    .from('production_orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: data })
}
