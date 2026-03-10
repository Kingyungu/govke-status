/**
 * monitor/checker.ts
 *
 * Core monitoring logic — probes service URLs and persists results.
 * Called by the Vercel Cron route handler at /api/cron/check every minute.
 *
 * Auto-incident logic:
 *   - If a service has been 'down' for 2 consecutive checks → open an incident
 *   - If a service with an open incident comes back 'up' → resolve the incident
 */

import type { DbService, DbCheck, CheckStatus, DbIncident, IncidentUpdate } from '@/types'
import { getDb } from '@/lib/supabase'

const DEFAULT_TIMEOUT_MS = 15_000
const DEGRADED_THRESHOLD_MS = 8_000

/**
 * Browser-like headers reduce the chance of WAFs/CDNs blocking the probe.
 * We still identify ourselves in the User-Agent so server logs are transparent.
 */
const PROBE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (compatible; govke-status/1.0; +https://status.wahenga.co.uk)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-KE,en;q=0.9,sw;q=0.8',
  'Cache-Control': 'no-cache',
}

export interface ProbeResult {
  service: DbService
  status: CheckStatus
  response_time_ms: number | null
  status_code: number | null
  error: string | null
}

type AttemptResult = {
  status: CheckStatus
  responseTimeMs: number | null
  statusCode: number | null
  error: string | null
}

/**
 * Status classification rules:
 *
 *  2xx / 3xx  fast  → up
 *  2xx / 3xx  slow  → degraded  (responded but sluggish)
 *  4xx              → degraded  (server is reachable; it's actively rejecting us)
 *  5xx              → down      (server-side error)
 *  network failure  → down      (unreachable)
 *
 * The key insight: a 4xx means the server sent a response — it is UP.
 * Marking it "down" causes false-positive outage alerts for sites that
 * block automated requests (most .go.ke properties do this).
 */
function classifyHttpResponse(statusCode: number, responseTimeMs: number): CheckStatus {
  if (statusCode >= 500) return 'down'
  if (statusCode >= 400) return 'degraded'   // server up, rejecting bots
  if (responseTimeMs > DEGRADED_THRESHOLD_MS) return 'degraded'
  return 'up'
}

async function attemptProbe(
  url: string,
  method: 'HEAD' | 'GET',
  timeoutMs: number,
): Promise<AttemptResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const start = Date.now()

  try {
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      redirect: 'follow',
      headers: PROBE_HEADERS,
      cache: 'no-store',
    })
    clearTimeout(timer)
    const responseTimeMs = Date.now() - start
    const statusCode = res.status

    // 405 = server doesn't support HEAD → caller should retry with GET
    if (method === 'HEAD' && statusCode === 405) {
      return { status: 'down', responseTimeMs, statusCode, error: 'HEAD not allowed' }
    }

    return {
      status: classifyHttpResponse(statusCode, responseTimeMs),
      responseTimeMs,
      statusCode,
      error: null,
    }
  } catch (err) {
    clearTimeout(timer)
    const elapsed = Date.now() - start
    const isTimeout = (err as Error)?.name === 'AbortError'
    const message = isTimeout
      ? 'Request timed out'
      : friendlyNetworkError(err)
    return {
      status: 'down',
      responseTimeMs: isTimeout ? timeoutMs : elapsed,
      statusCode: null,
      error: message,
    }
  }
}

/** Convert cryptic Node fetch errors into readable messages.
 *  Node's fetch wraps the real cause inside err.cause — check both. */
function friendlyNetworkError(err: unknown): string {
  // Extract the deepest available message (err → err.cause → err.cause.cause)
  const messages: string[] = []
  let cur: unknown = err
  while (cur && typeof cur === 'object') {
    const msg = (cur as { message?: string }).message
    if (msg) messages.push(msg)
    cur = (cur as { cause?: unknown }).cause
  }
  const full = messages.join(' | ')

  if (/ENOTFOUND|getaddrinfo/i.test(full)) return 'DNS resolution failed'
  if (/ECONNREFUSED/i.test(full)) return 'Connection refused'
  if (/ECONNRESET/i.test(full)) return 'Connection reset'
  if (/ETIMEDOUT/i.test(full)) return 'Connection timed out'
  if (/certificate|SSL|TLS/i.test(full)) return 'SSL/TLS error'
  if (/fetch failed/i.test(full) && messages.length === 1) return 'Network unreachable'
  const display = full || String(err)
  return display.length > 120 ? display.slice(0, 120) + '…' : display
}

export async function probeService(service: DbService): Promise<ProbeResult> {
  // 1. Try HEAD
  let result = await attemptProbe(service.url, 'HEAD', DEFAULT_TIMEOUT_MS)

  // 2. Fall back to GET if HEAD wasn't supported or got a network-level failure
  const headFailed =
    result.statusCode === null ||   // network error
    result.statusCode === 405 ||    // method not allowed
    result.statusCode === 501       // not implemented
  if (headFailed) {
    result = await attemptProbe(service.url, 'GET', DEFAULT_TIMEOUT_MS)
  }

  // 3. One retry on pure network failure (transient DNS / connection blip)
  if (result.status === 'down' && result.statusCode === null) {
    await new Promise((r) => setTimeout(r, 1500)) // brief pause before retry
    result = await attemptProbe(service.url, 'GET', DEFAULT_TIMEOUT_MS)
  }

  return { service, ...result }
}

// ── Persist check result ──────────────────────────────────────────────────────

export async function persistCheck(probe: ProbeResult): Promise<string | null> {
  try {
    const db = getDb()
    const { data, error } = await db
      .from('checks')
      .insert({
        service_id: probe.service.id,
        status: probe.status,
        response_time_ms: probe.response_time_ms,
        status_code: probe.status_code,
        error: probe.error,
      })
      .select('id')
      .single()

    if (error) {
      console.error(`[checker] DB insert failed for ${probe.service.name}:`, error.message)
      return null
    }
    return (data as { id: string }).id
  } catch (err) {
    console.error(`[checker] Unexpected persist error for ${probe.service.name}:`, err)
    return null
  }
}

// ── Auto-incident management ──────────────────────────────────────────────────

async function getLastNChecks(serviceId: string, n: number): Promise<DbCheck[]> {
  const db = getDb()
  const { data, error } = await db
    .from('checks')
    .select('*')
    .eq('service_id', serviceId)
    .order('checked_at', { ascending: false })
    .limit(n)

  if (error) {
    console.error(`[checker] Failed to fetch last checks for ${serviceId}:`, error.message)
    return []
  }
  return (data as DbCheck[]) ?? []
}

async function getOpenIncident(serviceId: string): Promise<DbIncident | null> {
  const db = getDb()
  const { data, error } = await db
    .from('incidents')
    .select('*')
    .eq('service_id', serviceId)
    .is('resolved_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error(`[checker] Failed to fetch open incident for ${serviceId}:`, error.message)
    return null
  }
  return (data as DbIncident | null)
}

async function openIncident(probe: ProbeResult): Promise<void> {
  try {
    const db = getDb()
    const firstUpdate: IncidentUpdate = {
      message: `${probe.service.name} is not responding. ${probe.error ?? `HTTP ${probe.status_code}`}`,
      timestamp: new Date().toISOString(),
      status: 'investigating',
    }
    await db.from('incidents').insert({
      service_id: probe.service.id,
      title: `${probe.service.name} is down`,
      status: 'investigating',
      updates: [firstUpdate],
    })
    console.log(`[checker] Opened incident for ${probe.service.name}`)
  } catch (err) {
    console.error(`[checker] Failed to open incident for ${probe.service.name}:`, err)
  }
}

async function resolveIncident(incident: DbIncident, probe: ProbeResult): Promise<void> {
  try {
    const db = getDb()
    const resolveUpdate: IncidentUpdate = {
      message: `${probe.service.name} is responding normally. Incident resolved.`,
      timestamp: new Date().toISOString(),
      status: 'resolved',
    }
    await db
      .from('incidents')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        updates: [...(incident.updates ?? []), resolveUpdate],
      })
      .eq('id', incident.id)
    console.log(`[checker] Resolved incident for ${probe.service.name}`)
  } catch (err) {
    console.error(`[checker] Failed to resolve incident for ${probe.service.name}:`, err)
  }
}

export async function handleIncidentLogic(probe: ProbeResult): Promise<void> {
  const openIncidentRecord = await getOpenIncident(probe.service.id)

  if (probe.status === 'down') {
    if (openIncidentRecord) return // already open, nothing to do

    // Check if last 2 checks were both down
    const lastChecks = await getLastNChecks(probe.service.id, 2)
    const allDown = lastChecks.length >= 2 && lastChecks.every((c) => c.status === 'down')
    if (allDown) {
      await openIncident(probe)
    }
  } else if (probe.status === 'up' && openIncidentRecord) {
    await resolveIncident(openIncidentRecord, probe)
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function runChecks(): Promise<ProbeResult[]> {
  const db = getDb()
  const { data: services, error } = await db
    .from('services')
    .select('*')
    .eq('is_active', true)

  if (error) {
    throw new Error(`Failed to fetch services: ${error.message}`)
  }

  const activeServices = (services as DbService[]) ?? []
  if (activeServices.length === 0) {
    console.warn('[checker] No active services found. Have you run the seed?')
    return []
  }

  // Probe all services concurrently
  const probes = await Promise.all(activeServices.map(probeService))

  // Persist + handle incidents concurrently (errors are logged, not thrown)
  await Promise.all([
    ...probes.map(persistCheck),
    ...probes.map(handleIncidentLogic),
  ])

  return probes
}
