import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase'
import type { DbCheck, ChecksResponse } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  const { serviceId } = params

  try {
    const db = getDb()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)

    // Verify service exists
    const { data: service, error: serviceError } = await db
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .maybeSingle()

    if (serviceError) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const { data, error } = await db
      .from('checks')
      .select('*')
      .eq('service_id', serviceId)
      .gte('checked_at', cutoff.toISOString())
      .order('checked_at', { ascending: false })
      .limit(2160)

    if (error) {
      console.error(`[api/checks/${serviceId}] Supabase error:`, error.message)
      return NextResponse.json({ error: 'Failed to fetch checks' }, { status: 500 })
    }

    const response: ChecksResponse = {
      service_id: serviceId,
      checks: (data as DbCheck[]) ?? [],
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    })
  } catch (err) {
    console.error(`[api/checks/${serviceId}] Unexpected error:`, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
