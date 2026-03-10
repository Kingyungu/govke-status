import type { DbCheck, CheckStatus, OverallStatus } from '@/types'

/**
 * Uptime % over the last `days` days.
 * "Up" = status is 'up' or 'degraded' (service was reachable).
 * Returns null when there are no checks in the window.
 */
export function calculateUptimePct(checks: DbCheck[], days = 90): number | null {
  if (checks.length === 0) return null

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const inWindow = checks.filter((c) => new Date(c.checked_at) >= cutoff)
  if (inWindow.length === 0) return null

  const upCount = inWindow.filter((c) => c.status === 'up' || c.status === 'degraded').length
  return Math.round((upCount / inWindow.length) * 10000) / 100
}

/**
 * Bucket checks into daily slots (oldest first) for sparkline rendering.
 * Each slot holds the worst status seen that day.
 */
export function bucketByDay(
  checks: DbCheck[],
  bucketCount = 90
): { date: string; status: CheckStatus | 'no_data' }[] {
  const buckets: { date: string; status: CheckStatus | 'no_data' }[] = []

  for (let i = bucketCount - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayChecks = checks.filter((c) => c.checked_at.startsWith(dateStr))

    let status: CheckStatus | 'no_data' = 'no_data'
    if (dayChecks.length > 0) {
      if (dayChecks.some((c) => c.status === 'down')) status = 'down'
      else if (dayChecks.some((c) => c.status === 'degraded')) status = 'degraded'
      else status = 'up'
    }
    buckets.push({ date: dateStr, status })
  }

  return buckets
}

/**
 * Derive the overall platform status.
 * 4+ down → major_outage, 1–3 down → partial_outage, otherwise → operational.
 */
export function deriveOverallStatus(statuses: CheckStatus[]): OverallStatus {
  const downCount = statuses.filter((s) => s === 'down').length
  if (downCount >= 4) return 'major_outage'
  if (downCount >= 1) return 'partial_outage'
  return 'operational'
}

export const STATUS_LABELS: Record<CheckStatus, string> = {
  up: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
}

export const OVERALL_LABELS: Record<OverallStatus, { en: string; sw: string }> = {
  operational: {
    en: 'All Systems Operational',
    sw: 'Huduma Zote Zinafanya Kazi',
  },
  partial_outage: {
    en: 'Partial Outage — Some services are experiencing issues',
    sw: 'Tatizo la Sehemu — Huduma kadhaa zinaathirika',
  },
  major_outage: {
    en: 'Major Outage — Multiple services are affected',
    sw: 'Tatizo Kubwa — Huduma nyingi zinaathirika',
  },
}
