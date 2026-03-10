import type { DbIncident, IncidentStatus } from '@/types'

interface Props {
  incidents: DbIncident[]
}

const INCIDENT_STATUS_BADGE: Record<IncidentStatus, string> = {
  investigating: 'bg-status-down-bg text-status-down border-status-down-border',
  identified: 'bg-status-degraded-bg text-status-degraded border-status-degraded-border',
  monitoring: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-status-up-bg text-status-up border-status-up-border',
}

const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Nairobi',
  })
}

export default function IncidentList({ incidents }: Props) {
  if (incidents.length === 0) {
    return (
      <p className="text-govke-grey-3 text-sm py-6 text-center">
        No incidents in the last 90 days.
      </p>
    )
  }

  return (
    <ol className="space-y-6" aria-label="Incident history">
      {incidents.map((incident) => (
        <li key={incident.id} className="bg-white border border-govke-border rounded p-5">
          {/* Incident header */}
          <div className="flex flex-wrap items-start gap-3 justify-between">
            <div>
              <span
                className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded border mr-2 ${INCIDENT_STATUS_BADGE[incident.status]}`}
              >
                {INCIDENT_STATUS_LABELS[incident.status]}
              </span>
              <span className="font-semibold text-govke-black">{incident.title}</span>
            </div>
            <time
              className="text-xs text-govke-grey-3 flex-shrink-0"
              dateTime={incident.started_at}
            >
              Started: {formatDate(incident.started_at)}
            </time>
          </div>

          {incident.resolved_at && (
            <p className="text-xs text-govke-grey-3 mt-1">
              Resolved: {formatDate(incident.resolved_at)}
            </p>
          )}

          {/* Update timeline (newest first) */}
          {incident.updates && incident.updates.length > 0 && (
            <ol className="mt-4 space-y-3 border-l-2 border-govke-border ml-2 pl-4">
              {[...incident.updates].reverse().map((update, i) => (
                <li key={i} className="relative">
                  <span
                    className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded border mr-2 ${INCIDENT_STATUS_BADGE[update.status]}`}
                  >
                    {INCIDENT_STATUS_LABELS[update.status]}
                  </span>
                  <span className="text-sm text-govke-grey-3">{update.message}</span>
                  <time
                    className="block text-xs text-govke-grey-2 mt-0.5"
                    dateTime={update.timestamp}
                  >
                    {formatDate(update.timestamp)}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </li>
      ))}
    </ol>
  )
}
