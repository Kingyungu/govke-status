/** Status of an individual service check */
export type CheckStatus = 'up' | 'down' | 'degraded'

/** Overall platform status derived from all services */
export type OverallStatus = 'operational' | 'partial_outage' | 'major_outage'

/** Lifecycle status of an incident */
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved'

/** Service category */
export type ServiceCategory = 'national' | 'county'

// ── DB row types ─────────────────────────────────────────────────────────────

export interface DbService {
  id: string
  name: string
  url: string
  category: ServiceCategory
  is_active: boolean
  created_at: string
}

export interface DbCheck {
  id: string
  service_id: string
  checked_at: string
  status: CheckStatus
  response_time_ms: number | null
  status_code: number | null
  error: string | null
}

export interface IncidentUpdate {
  message: string
  timestamp: string
  status: IncidentStatus
}

export interface DbIncident {
  id: string
  service_id: string
  title: string
  status: IncidentStatus
  started_at: string
  resolved_at: string | null
  updates: IncidentUpdate[]
}

// ── Seed / static config type ────────────────────────────────────────────────

export interface ServiceSeed {
  name: string
  url: string
  category: ServiceCategory
}

// ── API response shapes ───────────────────────────────────────────────────────

export interface ServiceStatusItem {
  id: string
  name: string
  url: string
  category: ServiceCategory
  current_status: CheckStatus
  uptime_90d: number | null
  last_checked: string | null
  response_time_ms: number | null
  active_incident: DbIncident | null
  /** Last 90 days of checks, newest first — used for sparkline */
  recent_checks: DbCheck[]
}

export interface StatusResponse {
  overall: OverallStatus
  updated_at: string
  services: ServiceStatusItem[]
}

export interface IncidentsResponse {
  incidents: DbIncident[]
}

export interface ChecksResponse {
  service_id: string
  checks: DbCheck[]
}
