import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export function createRouteClient() {
  return getAnonClient()
}

export async function getRouteUser(req: NextRequest) {
  const sb = getAnonClient()
  if (!sb) return { sb: null, user: null }

  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) return { sb, user: null }

  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return { sb, user: null }

  // Attach token so subsequent queries run as this user
  sb.auth.setSession({ access_token: token, refresh_token: '' }).catch(() => {})

  return { sb, user }
}
