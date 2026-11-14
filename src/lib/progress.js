// The local-first progress document and the small helpers that turn it into
// something the profile page can read. The same shape is stored in Supabase.

import { familiaRomanaBook, romaAeternaBook, exercitiaBook, latinViaOvidBook, learnLatinBook, companionBook, colloquiaBook, fabulaeBook, sermonesBook, exercitiaIIBook, caesarBook, epitomeBook, petroniusBook, arsBook, companionRABook, aeneisBook, catilinaBook, amphitryoBook } from '../data/library.js'

export const PROGRESS_VERSION = 1

export const TRACKED_BOOKS = [familiaRomanaBook, romaAeternaBook, exercitiaBook, latinViaOvidBook, learnLatinBook, companionBook, colloquiaBook, fabulaeBook, sermonesBook, exercitiaIIBook, caesarBook, epitomeBook, petroniusBook, arsBook, companionRABook, aeneisBook, catilinaBook, amphitryoBook].map((book) => ({
  id: book.id,
  title: book.title,
  shortTitle: book.shortTitle,
  slug: book.slug,
  chapterCount: book.chapterCount,
  numbers: book.chapters.map((chapter) => chapter.number),
}))

export const progressKey = (bookId) => `virgil:progress:${bookId}`

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeNumbers(value, allowed) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  for (const item of value) {
    const number = Number(item)
    if (Number.isInteger(number) && allowed.has(number)) seen.add(number)
  }
  return [...seen].sort((a, b) => a - b)
}

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

/**
 * Accepts a stored document and returns a tidy copy. Only the two course books
 * currently carry learner progress; reference texts have no "learned" state.
 */
export function normalizeProgress(value) {
  const source = isObject(value) ? value : {}
  const books = isObject(source.books) ? source.books : source
  const normalized = {}
  for (const book of TRACKED_BOOKS) {
    normalized[book.id] = normalizeNumbers(books[book.id], new Set(book.numbers))
  }
  return { version: PROGRESS_VERSION, books: normalized }
}

/** Reads the progress that this device currently holds. */
export function readLocalProgress() {
  const books = {}
  for (const book of TRACKED_BOOKS) {
    books[book.id] = readJson(progressKey(book.id), [])
  }
  return normalizeProgress({ books })
}

function publish(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return false
  }
  // The mounted useLocalStorage hooks listen for this so loading an account
  // copy updates the open app without a reload.
  try {
    window.dispatchEvent(new CustomEvent('virgil:storage', { detail: { key, value } }))
  } catch {
    /* older browsers can ignore the live update; storage is still written */
  }
  return true
}

/** Replaces the local progress with an account copy. */
export function applyLocalProgress(document) {
  const progress = normalizeProgress(document)
  if (typeof window === 'undefined') {
    return { ok: false, error: 'This device cannot store progress.' }
  }

  for (const book of TRACKED_BOOKS) {
    if (!publish(progressKey(book.id), progress.books[book.id])) {
      return {
        ok: false,
        error: 'This device could not store the account copy. Its local storage may be full.',
      }
    }
  }

  return { ok: true, progress }
}

export function summarizeProgress(document) {
  const progress = normalizeProgress(document)
  const books = TRACKED_BOOKS.map((book) => {
    const learned = progress.books[book.id].length
    return {
      ...book,
      learned,
      percent: book.chapterCount ? Math.round((learned / book.chapterCount) * 100) : 0,
    }
  })
  const total = books.reduce((sum, book) => sum + book.learned, 0)
  const totalChapters = books.reduce((sum, book) => sum + book.chapterCount, 0)

  return {
    books,
    total,
    totalChapters,
    percent: totalChapters ? Math.round((total / totalChapters) * 100) : 0,
  }
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

/** A stable comparison value for “does this device match the account copy?”. */
export function progressFingerprint(document) {
  const progress = normalizeProgress(document)
  return stableStringify({ version: progress.version, books: progress.books })
}

/**
 * Reads one book's learned chapter numbers straight from local storage. This
 * is used by the Iter, which spans every book (including ones outside the
 * core TRACKED_BOOKS list, such as the Learn Latin course).
 */
export function readBookProgress(bookId) {
  const value = readJson(progressKey(bookId), [])
  if (!Array.isArray(value)) return []
  const seen = new Set()
  for (const item of value) {
    const number = Number(item)
    if (Number.isInteger(number)) seen.add(number)
  }
  return [...seen].sort((a, b) => a - b)
}

/** Marks (or unmarks) a single chapter as learned, preserving the book's list. */
export function setChapterDone(bookId, number, done) {
  const current = new Set(readBookProgress(bookId))
  if (done) current.add(number)
  else current.delete(number)
  const next = [...current].sort((a, b) => a - b)
  const ok = publish(progressKey(bookId), next)
  return { ok, numbers: next }
}
