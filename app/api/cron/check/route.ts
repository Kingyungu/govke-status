import { NextRequest, NextResponse } from 'next/server'
import { runChecks } from '@/monitor/checker'

/**
 * GET|POST /api/cron/check
 *
 * Protected endpoint invoked by Vercel Cron every minute.
 * Vercel sends CRON_SECRET as: Authorization: Bearer <secret>
 *
 * Manual test:
 *   curl -X POST https://status.wahenga.co.uk/api/cron/check \
 *     -H "Authorization: Bearer <CRON_SECRET>"
 */
async function handler(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[cron/check] CRON_SECRET env var is not configured')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader

  if (token !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()

  try {
    const results = await runChecks()
    const elapsed = Date.now() - startedAt

    const summary = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1
      return acc
    }, {})

    console.log(`[cron/check] ${results.length} services checked in ${elapsed}ms`, summary)

    return NextResponse.json({
      ok: true,
      checked_at: new Date().toISOString(),
      elapsed_ms: elapsed,
      total: results.length,
      summary,
      results: results.map((r) => ({
        name: r.service.name,
        status: r.status,
        response_time_ms: r.response_time_ms,
        status_code: r.status_code,
        error: r.error,
      })),
    })
  } catch (err) {
    const elapsed = Date.now() - startedAt
    console.error('[cron/check] Fatal error:', err)
    return NextResponse.json(
      { error: 'Check run failed', detail: String(err), elapsed_ms: elapsed },
      { status: 500 }
    )
  }
}

export const GET = handler
export const POST = handler
