import { NextResponse } from 'next/server'
import { getDb } from '@/lib/supabase'
import { calculateUptimePct, deriveOverallStatus } from '@/lib/uptime'
import type { DbService, DbCheck, DbIncident, ServiceStatusItem, StatusResponse } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = getDb()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)

    // Fetch all active services
    const { data: services, error: servicesError } = await db
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (servicesError) {
      console.error('[api/status] services fetch error:', servicesError.message)
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
    }

    const serviceList = (services as DbService[]) ?? []
    if (serviceList.length === 0) {
      const response: StatusResponse = {
        overall: 'operational',
        updated_at: new Date().toISOString(),
        services: [],
      }
      return NextResponse.json(response)
    }

    const serviceIds = serviceList.map((s) => s.id)

    // Fetch 90 days of checks in one query
    const { data: checks, error: checksError } = await db
      .from('checks')
      .select('*')
      .in('service_id', serviceIds)
      .gte('checked_at', cutoff.toISOString())
      .order('checked_at', { ascending: false })

    if (checksError) {
      console.error('[api/status] checks fetch error:', checksError.message)
      return NextResponse.json({ error: 'Failed to fetch checks' }, { status: 500 })
    }

    // Fetch open incidents
    const { data: incidents, error: incidentsError } = await db
      .from('incidents')
      .select('*')
      .in('service_id', serviceIds)
      .is('resolved_at', null)

    if (incidentsError) {
      console.error('[api/status] incidents fetch error:', incidentsError.message)
      // Continue without incident data rather than failing completely
    }

    // Group data by service
    const checksByService = new Map<string, DbCheck[]>()
    for (const check of (checks as DbCheck[]) ?? []) {
      const arr = checksByService.get(check.service_id) ?? []
      arr.push(check)
      checksByService.set(check.service_id, arr)
    }

    const incidentByService = new Map<string, DbIncident>()
    for (const inc of (incidents as DbIncident[]) ?? []) {
      incidentByService.set(inc.service_id, inc)
    }

    const updatedAt = (checks as DbCheck[])?.[0]?.checked_at ?? new Date().toISOString()

    const statusItems: ServiceStatusItem[] = serviceList.map((service) => {
      const serviceChecks = checksByService.get(service.id) ?? []
      const latestCheck = serviceChecks[0] ?? null
      const current_status = latestCheck?.status ?? 'down'

      return {
        id: service.id,
        name: service.name,
        url: service.url,
        category: service.category,
        current_status,
        uptime_90d: calculateUptimePct(serviceChecks, 90),
        last_checked: latestCheck?.checked_at ?? null,
        response_time_ms: latestCheck?.response_time_ms ?? null,
        active_incident: incidentByService.get(service.id) ?? null,
        recent_checks: serviceChecks.slice(0, 180), // enough for 90 daily buckets
      }
    })

    const overall = deriveOverallStatus(statusItems.map((s) => s.current_status))

    const response: StatusResponse = {
      overall,
      updated_at: updatedAt,
      services: statusItems,
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    })
  } catch (err) {
    console.error('[api/status] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
