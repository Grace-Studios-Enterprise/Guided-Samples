import { NextRequest, NextResponse } from 'next/server'
import { getRouteUser } from '@/lib/supabase-server'

// GET  /api/notifications        — list unread notifications
// PATCH /api/notifications       — mark all as read

export async function GET(req: NextRequest) {
  const { sb: supabase } = await getRouteUser(req)
  if (!supabase) return NextResponse.json({ notifications: [] })

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ notifications: [] }, { status: 500 })
  return NextResponse.json({ notifications: data })
}

export async function PATCH(req: NextRequest) {
  const { sb: supabase, user: session } = await getRouteUser(req)
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 })
  if (!session) return NextResponse.json({ ok: false }, { status: 401 })

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_email', session.email)
    .eq('is_read', false)

  return NextResponse.json({ ok: true })
}
