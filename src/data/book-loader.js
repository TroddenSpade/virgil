// Load one book's full text on demand.
//
// Every book is a dynamic import, so Vite emits it as its own chunk (under
// assets/books/ in the production build). The light registry in library.js
// supplies titles and chapter outlines; this module merges the full chapter
// data in when a reading page asks for it.
import { getBook } from './library.js'
import { rememberBookResources } from '../lib/offline.js'

const loaders = import.meta.glob('./*/index.js')
const pending = new Map()

function resourceUrls() {
  if (typeof performance === 'undefined') return new Set()
  return new Set(
    performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((name) => name.endsWith('.js')),
  )
}

function merge(meta, mod) {
  const referenceIds = new Map(
    meta.chapters.map((chapter) => [chapter.number, chapter.referenceId]),
  )
  const chapters = (mod.chapters || []).map((chapter) => ({
    ...chapter,
    referenceId: referenceIds.get(chapter.number) || null,
  }))

  return {
    ...mod.book,
    ...meta,
    chapters,
    extras: mod.book.extras || mod.extras || [],
  }
}

export function loadBook(slug) {
  if (!slug) return Promise.resolve(null)
  if (pending.has(slug)) return pending.get(slug)

  const meta = getBook(slug)
  const load = meta && loaders[meta.modulePath]
  if (!load) return Promise.resolve(null)

  const before = resourceUrls()
  const promise = load()
    .then((mod) => {
      const added = [...resourceUrls()].filter((url) => !before.has(url))
      rememberBookResources(slug, added)
      return merge(meta, mod)
    })
    .catch((error) => {
      pending.delete(slug)
      throw error
    })

  pending.set(slug, promise)
  return promise
}

export default loadBook
