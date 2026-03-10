import { NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase'
import type { DbIncident, IncidentsResponse } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getDb()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)

    const { data, error } = await db
      .from('incidents')
      .select('*')
      .gte('started_at', cutoff.toISOString())
      .order('started_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[api/incidents] Supabase error:', error.message)
      return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 })
    }

    const response: IncidentsResponse = {
      incidents: (data as DbIncident[]) ?? [],
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    })
  } catch (err) {
    console.error('[api/incidents] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
