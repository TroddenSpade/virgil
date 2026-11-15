// The small state that makes one day's Hodiē session resumable.
//
// Reviews are inferred from the review store; this document only remembers
// the day's chosen reading and the result of the short form drill.

import { dayKey } from './review.js'

export const HODIE_KEY = 'virgil:hodie:v1'
const VERSION = 1

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function emptyHodieSession(now = Date.now()) {
  return {
    version: VERSION,
    day: dayKey(now),
    drill: null,
    reading: null,
  }
}

function cleanReading(value) {
  if (!isObject(value)) return null
  const bookId = String(value.bookId || '').trim()
  const number = Number(value.number)
  const href = String(value.href || '').trim()
  if (!bookId || !Number.isInteger(number) || !href) return null
  return {
    bookId,
    number,
    href,
    label: String(value.label || ''),
    title: String(value.title || ''),
    roman: String(value.roman || ''),
    bookShort: String(value.bookShort || ''),
  }
}

function cleanDrill(value) {
  if (!isObject(value) || !value.done) return null
  return {
    done: true,
    correct: Math.max(0, Math.round(Number(value.correct) || 0)),
    total: Math.max(0, Math.round(Number(value.total) || 0)),
    lemmaId: String(value.lemmaId || ''),
    completedAt: Number(value.completedAt) || Date.now(),
  }
}

export function normalizeHodieSession(value, now = Date.now()) {
  const source = isObject(value) ? value : {}
  const day = dayKey(now)
  if (!day || source.day !== day) return emptyHodieSession(now)
  return {
    version: VERSION,
    day,
    drill: cleanDrill(source.drill),
    reading: cleanReading(source.reading),
  }
}

export function readHodieSession(now = Date.now()) {
  if (typeof window === 'undefined') return emptyHodieSession(now)
  try {
    const raw = window.localStorage.getItem(HODIE_KEY)
    return raw === null
      ? emptyHodieSession(now)
      : normalizeHodieSession(JSON.parse(raw), now)
  } catch {
    return emptyHodieSession(now)
  }
}

export function writeHodieSession(value, now = Date.now()) {
  const next = normalizeHodieSession(value, now)
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(HODIE_KEY, JSON.stringify(next))
    } catch {
      /* A full storage should not break the session. */
    }
  }
  return next
}

export function markDrillDone({ correct = 0, total = 0, lemmaId = '' } = {}, now = Date.now()) {
  const current = readHodieSession(now)
  return writeHodieSession(
    {
      ...current,
      drill: { done: true, correct, total, lemmaId, completedAt: now },
    },
    now,
  )
}
