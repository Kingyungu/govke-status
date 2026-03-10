'use client'

interface Props {
  updatedAt: string | null
  isValidating: boolean
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function LastUpdated({ updatedAt, isValidating }: Props) {
  return (
    <p className="text-xs text-govke-grey-3" aria-live="polite">
      {isValidating ? (
        <span className="text-govke-grey-3 italic">Updating…</span>
      ) : updatedAt ? (
        <>
          Last checked:{' '}
          <time dateTime={updatedAt} className="font-medium text-govke-grey-4">
            {timeAgo(updatedAt)}
          </time>
        </>
      ) : (
        <span>Waiting for first check…</span>
      )}
    </p>
  )
}
