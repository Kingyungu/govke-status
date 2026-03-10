import { Suspense } from 'react'
import { getDb } from '@/lib/supabase'
import { calculateUptimePct, deriveOverallStatus } from '@/lib/uptime'
import { CATEGORY_LABELS } from '@/lib/services'
import type {
  DbService,
  DbCheck,
  DbIncident,
  ServiceStatusItem,
  StatusResponse,
  ServiceCategory,
} from '@/types'
import Dashboard from './Dashboard'

export const revalidate = 30

/**
 * Fetch initial data server-side for the first render (works with JS disabled).
 * The client Dashboard component then re-fetches via SWR every 60 s.
 */
async function getInitialData(): Promise<StatusResponse> {
  try {
    const db = getDb()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)

    const [servicesRes, checksRes, incidentsRes] = await Promise.all([
      db.from('services').select('*').eq('is_active', true).order('name'),
      db
        .from('checks')
        .select('*')
        .gte('checked_at', cutoff.toISOString())
        .order('checked_at', { ascending: false }),
      db.from('incidents').select('*').is('resolved_at', null),
    ])

    const services = (servicesRes.data as DbService[]) ?? []
    const checks = (checksRes.data as DbCheck[]) ?? []
    const incidents = (incidentsRes.data as DbIncident[]) ?? []

    const checksByService = new Map<string, DbCheck[]>()
    for (const check of checks) {
      const arr = checksByService.get(check.service_id) ?? []
      arr.push(check)
      checksByService.set(check.service_id, arr)
    }

    const incidentByService = new Map<string, DbIncident>()
    for (const inc of incidents) {
      incidentByService.set(inc.service_id, inc)
    }

    const statusItems: ServiceStatusItem[] = services.map((service) => {
      const serviceChecks = checksByService.get(service.id) ?? []
      const latestCheck = serviceChecks[0] ?? null
      return {
        id: service.id,
        name: service.name,
        url: service.url,
        category: service.category,
        current_status: latestCheck?.status ?? 'down',
        uptime_90d: calculateUptimePct(serviceChecks, 90),
        last_checked: latestCheck?.checked_at ?? null,
        response_time_ms: latestCheck?.response_time_ms ?? null,
        active_incident: incidentByService.get(service.id) ?? null,
        recent_checks: serviceChecks.slice(0, 180),
      }
    })

    return {
      overall: deriveOverallStatus(statusItems.map((s) => s.current_status)),
      updated_at: checks[0]?.checked_at ?? new Date().toISOString(),
      services: statusItems,
    }
  } catch (err) {
    console.error('[page] Failed to load initial data:', err)
    return { overall: 'operational', updated_at: new Date().toISOString(), services: [] }
  }
}

export default async function Home() {
  const initialData = await getInitialData()

  return (
    <Suspense fallback={<p className="text-govke-grey-3 text-sm">Loading status…</p>}>
      <Dashboard initialData={initialData} categoryLabels={CATEGORY_LABELS} />
    </Suspense>
  )
}
