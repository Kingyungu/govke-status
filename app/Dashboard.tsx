'use client'

import useSWR from 'swr'
import type { StatusResponse, ServiceStatusItem, ServiceCategory, IncidentsResponse } from '@/types'
import StatusBanner from '@/components/StatusBanner'
import ServiceCard from '@/components/ServiceCard'
import IncidentList from '@/components/IncidentList'
import LastUpdated from '@/components/LastUpdated'

interface Props {
  initialData: StatusResponse
  categoryLabels: Record<ServiceCategory, string>
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function Dashboard({ initialData, categoryLabels }: Props) {
  const {
    data: statusData,
    isValidating,
  } = useSWR<StatusResponse>('/api/status', fetcher, {
    fallbackData: initialData,
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  })

  const { data: incidentsData } = useSWR<IncidentsResponse>('/api/incidents', fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  })

  const data = statusData ?? initialData

  // Group services by category
  const byCategory = new Map<ServiceCategory, ServiceStatusItem[]>()
  for (const service of data.services) {
    const arr = byCategory.get(service.category) ?? []
    arr.push(service)
    byCategory.set(service.category, arr)
  }

  const categories = Array.from(
    new Set(data.services.map((s) => s.category))
  ) as ServiceCategory[]

  return (
    <div className="space-y-10">
      {/* ── Overall status + timestamp ────────────────────────────── */}
      <section aria-labelledby="overall-status-heading">
        <h1 id="overall-status-heading" className="sr-only">
          Overall Platform Status
        </h1>
        <StatusBanner status={data.overall} />
        <div className="mt-2 flex justify-end">
          <LastUpdated updatedAt={data.updated_at} isValidating={isValidating} />
        </div>
      </section>

      {/* ── Service grids ─────────────────────────────────────────── */}
      {categories.map((category) => {
        const services = byCategory.get(category) ?? []
        if (services.length === 0) return null

        return (
          <section key={category} aria-labelledby={`section-${category}`}>
            <h2
              id={`section-${category}`}
              className="text-base font-semibold text-govke-black border-b-2 border-govke-green pb-2 mb-4"
            >
              {categoryLabels[category]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </section>
        )
      })}

      {/* ── Incident history ──────────────────────────────────────── */}
      <section aria-labelledby="incidents-heading">
        <h2
          id="incidents-heading"
          className="text-base font-semibold text-govke-black border-b-2 border-govke-green pb-2 mb-4"
        >
          Incident History
        </h2>
        <IncidentList incidents={incidentsData?.incidents ?? []} />
      </section>
    </div>
  )
}
