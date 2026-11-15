// Spaced repetition for the personal wordlist.
//
// A word moves through seven boxes. A correct answer advances it; a miss
// sends it back to the beginning and into the current session again. The
// intervals widen as the box rises, so a word met for the first time returns
// tomorrow, then in three days, a week, a fortnight, a month, and so on.
//
// All state is local-first: one small object under `virgil:review:v1`,
// keyed by the normalized headword. Review history for a word is kept even
// when its chapter is unmarked, so the word returns with its place if the
// learner comes back to it.

export const REVIEW_KEY = 'virgil:review:v1'
export const REVIEW_VERSION = 1

export const DAY_MS = 24 * 60 * 60 * 1000
export const AGAIN_MS = 10 * 60 * 1000

export const BOX_INTERVALS = [0, 1, 3, 7, 16, 35, 75]
export const MAX_BOX = BOX_INTERVALS.length - 1

export const DEFAULT_NEW_PER_SESSION = 20
export const NEW_PER_SESSION_OPTIONS = [10, 20, 30, 50]
export const DAILY_TARGET = 20

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DAY_HISTORY = 400

export const RATINGS = [
  { key: 'again', label: 'Again', tone: 'again' },
  { key: 'hard', label: 'Hard', tone: 'hard' },
  { key: 'good', label: 'Good', tone: 'good' },
  { key: 'easy', label: 'Easy', tone: 'easy' },
]

export const STATUS_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'due', label: 'Due' },
  { key: 'new', label: 'New' },
  { key: 'learning', label: 'Learning' },
  { key: 'mature', label: 'Mature' },
]

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clampInt(value, min, max, fallback = 0) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.round(number)))
}

/** The local calendar day of a timestamp, as YYYY-MM-DD. */
export function dayKey(value = Date.now()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateFromDayKey(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function shiftDayKey(key, amount) {
  const date = dateFromDayKey(key)
  date.setDate(date.getDate() + amount)
  return dayKey(date)
}

function normalizeDays(value) {
  if (!isObject(value)) return {}
  const days = {}
  for (const [key, raw] of Object.entries(value)) {
    if (!DAY_KEY_PATTERN.test(key)) continue
    const count = clampInt(raw, 0, 1_000_000, 0)
    if (count > 0) days[key] = count
  }
  return days
}

// Older review documents only know when each word was last seen. Use those
// timestamps once to seed the day log, so an existing streak is not lost when
// this version first loads.
function daysFromWords(words) {
  const days = {}
  for (const state of Object.values(words)) {
    if (!state?.last) continue
    const key = dayKey(state.last)
    if (!key) continue
    days[key] = (days[key] || 0) + 1
  }
  return days
}

function pruneDays(days, now) {
  const today = dayKey(now)
  if (!today) return days
  const cutoff = shiftDayKey(today, -DAY_HISTORY)
  const kept = {}
  for (const [key, count] of Object.entries(days)) {
    if (key >= cutoff) kept[key] = count
  }
  return kept
}

function streakFromDays(days, now) {
  let cursor = dayKey(now)
  if (!cursor) return 0
  if (!days[cursor]) {
    cursor = shiftDayKey(cursor, -1)
    if (!days[cursor]) return 0
  }
  let streak = 0
  while (days[cursor]) {
    streak += 1
    cursor = shiftDayKey(cursor, -1)
  }
  return streak
}

export function emptyReview() {
  return {
    version: REVIEW_VERSION,
    words: {},
    days: {},
    settings: { newPerSession: DEFAULT_NEW_PER_SESSION },
  }
}

export function normalizeReview(value) {
  const source = isObject(value) ? value : {}
  const words = {}

  if (isObject(source.words)) {
    for (const [key, raw] of Object.entries(source.words)) {
      if (!key || !isObject(raw)) continue
      const seen = clampInt(raw.seen, 0, 1_000_000, 0)
      const box = clampInt(raw.box, 0, MAX_BOX, 0)
      const due = Number(raw.due)
      const correct = clampInt(raw.correct, 0, 1_000_000, 0)
      const streak = clampInt(raw.streak, 0, 1_000_000, 0)
      const lapses = clampInt(raw.lapses, 0, 1_000_000, 0)
      const last = Number(raw.last)
      if (!seen && !box && !due) continue
      words[key] = {
        box,
        due: Number.isFinite(due) ? due : 0,
        seen,
        correct,
        streak,
        lapses,
        last: Number.isFinite(last) ? last : 0,
      }
    }
  }

  const newPerSession = clampInt(
    source.settings?.newPerSession,
    5,
    100,
    DEFAULT_NEW_PER_SESSION,
  )

  const days = isObject(source.days)
    ? normalizeDays(source.days)
    : daysFromWords(words)

  return {
    version: REVIEW_VERSION,
    words,
    days,
    settings: { newPerSession },
  }
}

export function readReview() {
  if (typeof window === 'undefined') return emptyReview()
  try {
    const raw = window.localStorage.getItem(REVIEW_KEY)
    return raw === null ? emptyReview() : normalizeReview(JSON.parse(raw))
  } catch {
    return emptyReview()
  }
}

/** Replace the review document and let mounted hooks hear about it. */
export function writeReview(value) {
  const next = normalizeReview(value)
  if (typeof window === 'undefined') return next
  try {
    window.localStorage.setItem(REVIEW_KEY, JSON.stringify(next))
  } catch {
    return next
  }
  try {
    window.dispatchEvent(
      new CustomEvent('virgil:storage', {
        detail: { key: REVIEW_KEY, value: next },
      }),
    )
  } catch {
    /* older browsers can ignore the live update; storage is still written */
  }
  return next
}

export function stateFor(review, key) {
  return review?.words?.[key] || null
}

export function isNew(state) {
  return !state || !state.seen
}

export function isDue(state, now = Date.now()) {
  return Boolean(state && state.seen > 0 && state.due <= now)
}

export function statusOf(state, now = Date.now()) {
  if (isNew(state)) return { key: 'new', label: 'New' }
  if (isDue(state, now)) return { key: 'due', label: 'Due' }
  if (state.box <= 2) return { key: 'learning', label: 'Learning' }
  return { key: 'mature', label: 'Mature' }
}

export function nextBoxFor(rating, box = 0) {
  if (rating === 'again') return 0
  if (rating === 'hard') return Math.max(1, box)
  if (rating === 'easy') return Math.min(box + 2, MAX_BOX)
  return Math.min(box + 1, MAX_BOX)
}

export function dueFor(rating, box, now = Date.now()) {
  if (rating === 'again') return now + AGAIN_MS
  if (rating === 'hard') return now + DAY_MS
  const nextBox = nextBoxFor(rating, box)
  return now + (BOX_INTERVALS[nextBox] || 0) * DAY_MS
}

export function rateReview(review, key, rating, now = Date.now()) {
  const current = review?.words?.[key] || null
  const box = current?.box ?? 0
  const next = {
    box: nextBoxFor(rating, box),
    due: dueFor(rating, box, now),
    seen: (current?.seen || 0) + 1,
    correct: (current?.correct || 0) + (rating === 'again' ? 0 : 1),
    streak: rating === 'again' ? 0 : (current?.streak || 0) + 1,
    lapses: (current?.lapses || 0) + (rating === 'again' ? 1 : 0),
    last: now,
  }

  const base = isObject(review) ? review : emptyReview()
  const days = isObject(base.days)
    ? normalizeDays(base.days)
    : daysFromWords(base.words || {})
  const today = dayKey(now)
  if (today) days[today] = (days[today] || 0) + 1

  return {
    ...base,
    version: REVIEW_VERSION,
    words: {
      ...(base.words || {}),
      [key]: next,
    },
    days: pruneDays(days, now),
  }
}

/** Consecutive days with at least one review, allowing today to be empty. */
export function reviewStreak(review, now = Date.now()) {
  return streakFromDays(normalizeDays(review?.days), now)
}

/**
 * The daily habit at a glance: today's count against the target, a seven-day
 * strip, and the current streak. Bar heights are relative to the busiest day
 * in the strip (or the target, whichever is larger).
 */
export function habitStats(review, now = Date.now(), target = DAILY_TARGET) {
  const days = normalizeDays(review?.days)
  const wanted = clampInt(target, 1, 1000, DAILY_TARGET)
  const todayKey = dayKey(now)
  const today = todayKey ? days[todayKey] || 0 : 0
  const week = []
  let ceiling = wanted

  for (let offset = 6; offset >= 0; offset -= 1) {
    const key = todayKey ? shiftDayKey(todayKey, -offset) : ''
    const count = key ? days[key] || 0 : 0
    if (count > ceiling) ceiling = count
    week.push({
      key,
      label: key
        ? dateFromDayKey(key).toLocaleDateString('en-US', { weekday: 'short' })
        : '',
      count,
      isToday: offset === 0,
      height: 0,
    })
  }

  for (const day of week) {
    day.height = Math.round((day.count / ceiling) * 100)
  }

  return {
    today,
    target: wanted,
    percent: Math.min(100, Math.round((today / wanted) * 100)),
    streak: streakFromDays(days, now),
    week,
  }
}

export function formatDays(days) {
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

export function formatDuration(ms) {
  if (ms <= 0) return 'now'
  const minutes = Math.ceil(ms / 60000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.ceil(ms / 3600000)
  if (hours < 24) return `${hours} h`
  const days = Math.ceil(ms / DAY_MS)
  if (days < 120) return formatDays(days)
  return `${Math.round(days / 30)} months`
}

export function intervalLabel(rating, state) {
  if (rating === 'again') return '10 min'
  if (rating === 'hard') return '1 day'
  const box = state?.box ?? 0
  const nextBox = nextBoxFor(rating, box)
  return formatDays(BOX_INTERVALS[nextBox])
}

export function dueLabel(state, now = Date.now()) {
  if (isNew(state)) return 'Not yet reviewed'
  if (isDue(state, now)) return 'Due now'
  return `In ${formatDuration(state.due - now)}`
}

export function reviewStats(words, review, now = Date.now()) {
  const stats = {
    total: words.length,
    due: 0,
    new: 0,
    learning: 0,
    mature: 0,
    reviewed: 0,
  }

  for (const word of words) {
    const state = stateFor(review, word.key)
    if (!isNew(state)) stats.reviewed += 1
    const status = statusOf(state, now)
    if (status.key === 'due') stats.due += 1
    else if (status.key === 'new') stats.new += 1
    else if (status.key === 'learning') stats.learning += 1
    else stats.mature += 1
  }

  stats.percentReviewed = stats.total
    ? Math.round((stats.reviewed / stats.total) * 100)
    : 0

  return stats
}

export function dueWords(words, review, now = Date.now()) {
  return words
    .filter((word) => isDue(stateFor(review, word.key), now))
    .sort((a, b) => {
      const dueA = stateFor(review, a.key)?.due ?? 0
      const dueB = stateFor(review, b.key)?.due ?? 0
      if (dueA !== dueB) return dueA - dueB
      return a.order - b.order
    })
}

export function newWords(words, review) {
  return words
    .filter((word) => isNew(stateFor(review, word.key)))
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order
      return a.headword.localeCompare(b.headword, 'la')
    })
}

export function buildSession(
  words,
  review,
  mode = 'mixed',
  now = Date.now(),
  newLimit = DEFAULT_NEW_PER_SESSION,
) {
  const due = dueWords(words, review, now)
  const fresh = newWords(words, review).slice(0, newLimit)

  if (mode === 'due') return due
  if (mode === 'new') return fresh
  return [...due, ...fresh]
}
