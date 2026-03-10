import type { OverallStatus } from '@/types'
import { OVERALL_LABELS } from '@/lib/uptime'

interface Props {
  status: OverallStatus
}

const BG: Record<OverallStatus, string> = {
  operational: 'bg-govke-green',
  partial_outage: 'bg-status-degraded',
  major_outage: 'bg-status-down',
}

const ICON: Record<OverallStatus, string> = {
  operational: '✓',
  partial_outage: '⚠',
  major_outage: '✕',
}

export default function StatusBanner({ status }: Props) {
  const labels = OVERALL_LABELS[status]
  const bg = BG[status]
  const icon = ICON[status]

  return (
    <div
      className={`${bg} text-white rounded-lg px-6 py-5`}
      role="status"
      aria-live="polite"
      aria-label={`Overall status: ${labels.en}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold leading-none flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
        <div>
          <p className="text-lg font-semibold leading-snug">{labels.en}</p>
          <p className="text-sm mt-0.5 opacity-90">{labels.sw}</p>
        </div>
      </div>
    </div>
  )
}
