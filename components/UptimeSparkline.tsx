'use client'

import { bucketByDay } from '@/lib/uptime'
import type { DbCheck } from '@/types'

interface Props {
  checks: DbCheck[]
  days?: number
}

const BAR_COLORS: Record<string, string> = {
  up: 'bg-status-up',
  degraded: 'bg-status-degraded',
  down: 'bg-status-down',
  no_data: 'bg-govke-grey-2',
}

const BAR_LABELS: Record<string, string> = {
  up: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
  no_data: 'No data',
}

export default function UptimeSparkline({ checks, days = 90 }: Props) {
  const buckets = bucketByDay(checks, days)

  return (
    <div className="w-full" aria-label={`${days}-day uptime history chart`}>
      <div className="flex gap-px items-stretch h-7">
        {buckets.map((bucket) => (
          <div
            key={bucket.date}
            className={`flex-1 rounded-sm ${BAR_COLORS[bucket.status] ?? 'bg-gray-200'}`}
            title={`${bucket.date}: ${BAR_LABELS[bucket.status] ?? bucket.status}`}
            role="img"
            aria-label={`${bucket.date}: ${BAR_LABELS[bucket.status] ?? bucket.status}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-govke-grey-3">{days} days ago</span>
        <span className="text-xs text-govke-grey-3">Today</span>
      </div>
    </div>
  )
}
