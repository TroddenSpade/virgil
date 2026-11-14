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

export function emptyReview() {
  return {
    version: REVIEW_VERSION,
    words: {},
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

  return {
    version: REVIEW_VERSION,
    words,
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
  return {
    ...(isObject(review) ? review : emptyReview()),
    version: REVIEW_VERSION,
    words: {
      ...(review?.words || {}),
      [key]: next,
    },
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
