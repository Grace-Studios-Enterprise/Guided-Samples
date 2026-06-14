import { NextRequest, NextResponse } from 'next/server'
import { getRouteUser } from '@/lib/supabase-server'
import type { NotificationPreferences } from '@/lib/notifications'

// GET /api/notifications/preferences
export async function GET(req: NextRequest) {
  const { sb: supabase, user: session } = await getRouteUser(req)
  if (!supabase) return NextResponse.json({ email_enabled: true, email_overrides: {} })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('notification_preferences')
    .select('email_enabled, email_overrides')
    .eq('user_email', session.email)
    .maybeSingle()

  return NextResponse.json(data ?? { email_enabled: true, email_overrides: {} })
}

// PUT /api/notifications/preferences
export async function PUT(req: NextRequest) {
  const { sb: supabase, user: session } = await getRouteUser(req)
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as NotificationPreferences

  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_email:      session.email,
      email_enabled:   body.email_enabled,
      email_overrides: body.email_overrides ?? {},
      updated_at:      new Date().toISOString(),
    }, { onConflict: 'user_email' })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
