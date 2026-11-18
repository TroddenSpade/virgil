import { useOfflineReady } from '../hooks/useOfflineReady.js'

const LABELS = {
  checking: 'Checking offline copy…',
  ready: 'Available offline',
  none: 'Open a chapter once to save it offline',
}

export default function OfflineBadge({ slug }) {
  const state = useOfflineReady(slug)
  if (state === 'unavailable') return null

  return (
    <p
      className={`offline-badge offline-badge--${state}`}
      aria-live="polite"
    >
      <span className="offline-badge__mark" aria-hidden="true">
        {state === 'ready' ? '✓' : '↓'}
      </span>
      {LABELS[state]}
    </p>
  )
}
