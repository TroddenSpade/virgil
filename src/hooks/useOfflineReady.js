import { useEffect, useState } from 'react'
import { OFFLINE_BOOKS_EVENT, bookResources } from '../lib/offline.js'

const BOOK_CACHE = 'virgil-book-texts'

/**
 * Whether the book's JavaScript chunk is in the runtime cache.
 *
 * `checking` is the first render; `unavailable` means the browser cannot
 * inspect Cache Storage; `none` means no chapter has been opened yet (or the
 * cache was cleared); `ready` means the service worker has a copy.
 */
export function useOfflineReady(slug) {
  const [state, setState] = useState('checking')

  useEffect(() => {
    let cancelled = false
    let retry = null
    let attempts = 0

    const check = async () => {
      if (typeof caches === 'undefined') {
        if (!cancelled) setState('unavailable')
        return
      }

      const urls = bookResources(slug)
      if (!urls.length) {
        if (!cancelled) setState('none')
        return
      }

      try {
        const cache = await caches.open(BOOK_CACHE)
        const hits = await Promise.all(urls.map((url) => cache.match(url)))
        if (cancelled) return
        if (hits.some(Boolean)) {
          setState('ready')
          return
        }
        setState('none')
        // The worker may still be writing the response to the cache.
        if (attempts < 2) {
          attempts += 1
          retry = window.setTimeout(check, 1500)
        }
      } catch {
        if (!cancelled) setState('unavailable')
      }
    }

    check()

    const refresh = () => check()
    window.addEventListener(OFFLINE_BOOKS_EVENT, refresh)
    window.addEventListener('online', refresh)
    return () => {
      cancelled = true
      if (retry) window.clearTimeout(retry)
      window.removeEventListener(OFFLINE_BOOKS_EVENT, refresh)
      window.removeEventListener('online', refresh)
    }
  }, [slug])

  return state
}

export default useOfflineReady
