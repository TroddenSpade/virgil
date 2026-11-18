// Remember which book chunks have been fetched so the reader can show an
// honest "available offline" state. The service worker caches the chunk; this
// module only stores the URLs it saw the browser load.
const STORAGE_KEY = 'virgil:offline-books'
const EVENT = 'virgil:offline-books'

function storage() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readOfflineBooks() {
  const store = storage()
  if (!store) return {}
  try {
    const value = JSON.parse(store.getItem(STORAGE_KEY) || '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

export function bookResources(slug) {
  const entry = readOfflineBooks()[slug]
  return Array.isArray(entry?.urls) ? entry.urls : []
}

export function rememberBookResources(slug, urls) {
  if (!slug || !Array.isArray(urls) || !urls.length) return
  const store = storage()
  if (!store) return

  const all = readOfflineBooks()
  const previous = Array.isArray(all[slug]?.urls) ? all[slug].urls : []
  const next = [...new Set([...previous, ...urls])]
  if (next.length === previous.length) return

  all[slug] = { urls: next, at: Date.now() }
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(all))
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { slug } }))
  } catch {
    /* storage can be full or disabled; the reader simply sees no badge */
  }
}

export const OFFLINE_BOOKS_EVENT = EVENT
