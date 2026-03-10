import { NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase'
import type { DbIncident } from '@/types'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://status.wahenga.co.uk'

export async function GET() {
  try {
    const db = getDb()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)

    const { data, error } = await db
      .from('incidents')
      .select('*, services(name)')
      .gte('started_at', cutoff.toISOString())
      .order('started_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[api/feed.json] Supabase error:', error.message)
      return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
    }

    const incidents = (data as (DbIncident & { services: { name: string } | null })[]) ?? []

    const feed = {
      version: '1.0',
      title: 'GOV.KE Status — Incident Feed',
      home_page_url: SITE_URL,
      feed_url: `${SITE_URL}/api/feed.json`,
      description: 'Incident and outage updates for Kenyan government digital services',
      items: incidents.map((i) => ({
        id: i.id,
        title: i.title,
        summary: i.updates?.[i.updates.length - 1]?.message ?? i.title,
        date_published: i.started_at,
        date_modified: i.resolved_at ?? i.started_at,
        tags: [i.status, i.service_id],
        _govke: {
          service_id: i.service_id,
          service_name: i.services?.name ?? null,
          incident_status: i.status,
          resolved_at: i.resolved_at,
        },
      })),
    }

    return NextResponse.json(feed, {
      headers: {
        'Content-Type': 'application/feed+json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (err) {
    console.error('[api/feed.json] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
