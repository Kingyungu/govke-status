import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * All Supabase access is server-side only.
 * The browser never holds a Supabase key — it only calls our own Next.js API routes.
 *
 * Env vars (set in Vercel dashboard or .env.local):
 *   SUPABASE_URL          — your Supabase project URL
 *   SUPABASE_SERVICE_KEY  — service role key (bypasses RLS; never expose to browser)
 */

let _client: SupabaseClient | null = null

export function getDb(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url) throw new Error('Missing env: SUPABASE_URL')
  if (!key) throw new Error('Missing env: SUPABASE_SERVICE_KEY')

  if (!_client) {
    _client = createClient(url, key, {
      auth: { persistSession: false },
    })
  }
  return _client
}
