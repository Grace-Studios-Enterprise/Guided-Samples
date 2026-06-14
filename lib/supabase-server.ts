import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createRouteClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  if (!url || !key) return null
  const cookieStore = cookies()
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(toSet) {
        try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
        catch { /* route handlers can't mutate response cookies — safe to ignore */ }
      },
    },
  })
}
