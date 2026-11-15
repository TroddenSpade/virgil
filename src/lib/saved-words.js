// Words the reader saves by hand while reading, and words they already know.
//
// The automatic wordlist is derived from learned chapters. This store adds
// two small, local-first exceptions:
//   - saved:  a word met in a reading that should join the review queue;
//   - known:  a word the reader does not need to study.
// Everything is keyed by the same normalized headword the review cards use,
// so a word can never appear twice.

export const SAVED_WORDS_KEY = 'virgil:wordlist:v1'
export const SAVED_WORDS_EVENT = 'virgil:wordlist'

const VERSION = 1

export function emptySavedWords() {
  return { version: VERSION, saved: {}, known: {} }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function cleanSource(source) {
  if (!isObject(source)) return null
  const out = {}
  for (const key of [
    'bookId',
    'bookTitle',
    'bookShort',
    'bookSlug',
    'number',
    'roman',
    'title',
    'latinTitle',
    'slug',
    'href',
  ]) {
    if (source[key] != null) out[key] = source[key]
  }
  return Object.keys(out).length ? out : null
}

function cleanSavedEntry(value) {
  if (!isObject(value)) return null
  const key = String(value.key || '').trim()
  const headword = String(value.headword || '').trim()
  if (!key || !headword) return null
  return {
    key,
    headword,
    principal: String(value.principal || ''),
    english: String(value.english || ''),
    posGroup: String(value.posGroup || ''),
    form: String(value.form || ''),
    source: cleanSource(value.source),
    addedAt: Number(value.addedAt) || Date.now(),
  }
}

export function normalizeSavedWords(value) {
  const source = isObject(value) ? value : {}
  const saved = {}
  const known = {}

  if (isObject(source.saved)) {
    for (const [key, entry] of Object.entries(source.saved)) {
      const clean = cleanSavedEntry({ ...entry, key })
      if (clean) saved[clean.key] = clean
    }
  }

  if (isObject(source.known)) {
    for (const [key, stamp] of Object.entries(source.known)) {
      if (!key) continue
      const number = Number(stamp)
      if (Number.isFinite(number) && number > 0) known[key] = number
    }
  }

  return { version: VERSION, saved, known }
}

export function readSavedWords() {
  if (typeof window === 'undefined') return emptySavedWords()
  try {
    const raw = window.localStorage.getItem(SAVED_WORDS_KEY)
    return raw === null ? emptySavedWords() : normalizeSavedWords(JSON.parse(raw))
  } catch {
    return emptySavedWords()
  }
}

export function writeSavedWords(value) {
  const next = normalizeSavedWords(value)
  if (typeof window === 'undefined') return next
  try {
    window.localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(next))
    window.dispatchEvent(
      new CustomEvent(SAVED_WORDS_EVENT, { detail: { key: SAVED_WORDS_KEY } }),
    )
  } catch {
    /* A full or unavailable storage should not break the reading. */
  }
  return next
}

export function saveWord(entry) {
  const clean = cleanSavedEntry(entry)
  if (!clean) return readSavedWords()
  const current = readSavedWords()
  delete current.known[clean.key]
  if (current.saved[clean.key]) return current
  current.saved[clean.key] = clean
  return writeSavedWords(current)
}

export function removeSavedWord(key) {
  const current = readSavedWords()
  if (!current.saved[key]) return current
  delete current.saved[key]
  return writeSavedWords(current)
}

export function markWordKnown(key) {
  if (!key) return readSavedWords()
  const current = readSavedWords()
  // Keep a hand-saved word in the store so “Undo” can bring it back; the
  // wordlist filters it out while the known mark is present.
  current.known[key] = Date.now()
  return writeSavedWords(current)
}

export function unmarkWordKnown(key) {
  const current = readSavedWords()
  if (!current.known[key]) return current
  delete current.known[key]
  return writeSavedWords(current)
}

export function subscribeSavedWords(callback) {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (event) => {
    if (event.key === SAVED_WORDS_KEY) callback()
  }
  const onLocal = (event) => {
    if (event.detail?.key === SAVED_WORDS_KEY) callback()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(SAVED_WORDS_EVENT, onLocal)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(SAVED_WORDS_EVENT, onLocal)
  }
}
