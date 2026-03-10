import type { ServiceStatusItem } from '@/types'
import UptimeSparkline from './UptimeSparkline'
import { STATUS_LABELS } from '@/lib/uptime'

interface Props {
  service: ServiceStatusItem
}

const STATUS_DOT: Record<string, string> = {
  up: 'bg-status-up',
  degraded: 'bg-status-degraded',
  down: 'bg-status-down',
}

const STATUS_TEXT: Record<string, string> = {
  up: 'text-status-up',
  degraded: 'text-status-degraded',
  down: 'text-status-down',
}

const STATUS_BADGE_BG: Record<string, string> = {
  up: 'bg-status-up-bg text-status-up border-status-up-border',
  degraded: 'bg-status-degraded-bg text-status-degraded border-status-degraded-border',
  down: 'bg-status-down-bg text-status-down border-status-down-border',
}

function formatResponseTime(ms: number | null): string {
  if (ms === null) return ''
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export default function ServiceCard({ service }: Props) {
  const { current_status, uptime_90d, response_time_ms, recent_checks, active_incident } = service
  const rt = formatResponseTime(response_time_ms)

  return (
    <div className="bg-white rounded border border-govke-border p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow focus-within:outline focus-within:outline-2 focus-within:outline-govke-focus">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-govke-black text-sm leading-snug">
            <a
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-govke-focus"
            >
              {service.name}
            </a>
          </h3>
          {rt && (
            <p className="text-xs text-govke-grey-3 mt-0.5" aria-label={`Response time: ${rt}`}>
              {rt}
            </p>
          )}
        </div>

        {/* Status badge — uses text label + color (WCAG AA) */}
        <span
          className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded border ${STATUS_BADGE_BG[current_status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
          aria-label={`Status: ${STATUS_LABELS[current_status]}`}
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[current_status] ?? 'bg-gray-400'}`}
            aria-hidden="true"
          />
          {STATUS_LABELS[current_status]}
        </span>
      </div>

      {/* Uptime sparkline */}
      <UptimeSparkline checks={recent_checks} days={90} />

      {/* Uptime % */}
      <div className="flex justify-between items-center text-xs text-govke-grey-3 border-t border-govke-border pt-2">
        {uptime_90d !== null ? (
          <span>
            <span className={`font-semibold ${STATUS_TEXT[current_status] ?? 'text-govke-grey-4'}`}>
              {uptime_90d}%
            </span>
            {' uptime (90 days)'}
          </span>
        ) : (
          <span>No uptime data yet</span>
        )}
      </div>

      {/* Active incident banner */}
      {active_incident && (
        <div className="text-xs bg-status-degraded-bg border border-status-degraded-border text-status-degraded rounded px-3 py-2">
          <span className="font-semibold">Incident: </span>
          {active_incident.title}
        </div>
      )}
    </div>
  )
}
