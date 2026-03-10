/**
 * scripts/seed.ts
 * One-time seed: inserts all services into the `services` table.
 *
 * Run with:
 *   npx tsx scripts/seed.ts
 *
 * Requires env vars: SUPABASE_URL + SUPABASE_SERVICE_KEY
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { SERVICE_SEEDS } from '../lib/services'

// Load .env.local so this script works without setting env vars manually
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (key && !(key in process.env)) process.env[key] = val
  }
} catch {
  // .env.local not found — fall through to process.env
}

async function main() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY before running this script.')
    process.exit(1)
  }

  const db = createClient(url, key, { auth: { persistSession: false } })

  console.log(`Seeding ${SERVICE_SEEDS.length} services…`)

  for (const seed of SERVICE_SEEDS) {
    // Upsert by URL so re-running is idempotent
    const { error } = await db
      .from('services')
      .upsert({ ...seed, is_active: true }, { onConflict: 'url' })

    if (error) {
      console.error(`  FAILED: ${seed.name} — ${error.message}`)
    } else {
      console.log(`  OK: ${seed.name}`)
    }
  }

  console.log('Seed complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
