import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

// How often an open tab re-checks for a newer deployed version.
const UPDATE_INTERVAL = 30 * 60 * 1000 // 30 minutes

// The flag survives the automatic reload and lets the new page say that the
// update has already happened. It is not a "refresh now" prompt.
const UPDATED_KEY = 'virgil:pwa-updated'

// The service worker registration is wired up once, no matter how many times
// the component mounts (e.g. React StrictMode double-invokes effects in dev).
let wired = false

function takeUpdatedFlag() {
  if (typeof window === 'undefined') return false
  try {
    if (window.sessionStorage.getItem(UPDATED_KEY) !== '1') return false
    window.sessionStorage.removeItem(UPDATED_KEY)
    return true
  } catch {
    return false
  }
}

const pendingUpdated = takeUpdatedFlag()

function leaveUpdatedFlag() {
  try {
    window.sessionStorage.setItem(UPDATED_KEY, '1')
  } catch {
    /* sessionStorage can be unavailable in private browsing */
  }
}

/*
 * Updates are forced, not offered.
 *
 * With `registerType: 'autoUpdate'` the new service worker activates as soon
 * as it is installed. `onNeedReload` fires after that activation, so we set a
 * one-shot flag and reload into the fresh version. The next mount reads the
 * flag and shows a small "updated" notice — the reader never sees a stale
 * "new version available" prompt.
 */
export default function PwaUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
  } = useRegisterSW({
    immediate: true,
    onNeedReload() {
      leaveUpdatedFlag()
      window.location.reload()
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration || wired) return
      wired = true

      const check = () => registration.update().catch(() => {})
      window.setInterval(check, UPDATE_INTERVAL)
      // Re-check when the tab becomes visible or the network comes back.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
      window.addEventListener('online', check)
    },
  })

  const [updated, setUpdated] = useState(pendingUpdated)

  // Let both notices fade on their own; they are confirmations, not tasks.
  useEffect(() => {
    if (!updated) return undefined
    const timer = window.setTimeout(() => setUpdated(false), 7000)
    return () => window.clearTimeout(timer)
  }, [updated])

  useEffect(() => {
    if (!offlineReady) return undefined
    const timer = window.setTimeout(() => setOfflineReady(false), 6000)
    return () => window.clearTimeout(timer)
  }, [offlineReady, setOfflineReady])

  if (!updated && !offlineReady) return null

  return (
    <div className="pwa-update" role="status" aria-live="polite">
      <span className="pwa-update__icon" aria-hidden="true">
        {updated ? (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-2.6-6.4" />
            <path d="M21 3v6h-6" />
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>

      <p className="pwa-update__text">
        {updated ? (
          <>
            <strong>Updated.</strong> Virgil is now on the latest version.
          </>
        ) : (
          <>
            <strong>Saved for offline.</strong> Virgil is now on this device.
          </>
        )}
      </p>

      <button
        type="button"
        className="pwa-update__dismiss"
        aria-label="Dismiss"
        onClick={() => (updated ? setUpdated(false) : setOfflineReady(false))}
      >
        ×
      </button>
    </div>
  )
}
