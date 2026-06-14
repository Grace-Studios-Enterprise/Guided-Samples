import { createBrowserClient } from '@supabase/ssr'

type SupabaseClient = ReturnType<typeof createBrowserClient>

let _client: SupabaseClient | null = null

export function createClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  if (!url || url === 'your_supabase_project_url' || !key) return null
  if (!_client) _client = createBrowserClient(url, key)
  return _client
}
