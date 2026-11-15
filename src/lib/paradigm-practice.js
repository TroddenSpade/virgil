// Practice the forms a paradigm page already knows.
//
// A session mixes two question types:
//   - give the form for a grammatical slot;
//   - name the parse of a form.
// Results are kept locally by lemma and slot, so weak cases and tenses come
// back more often.

import { norm } from './dictionary.js'

export const PARADIGM_PRACTICE_KEY = 'virgil:paradigm-practice:v1'
const VERSION = 1

export function emptyPractice() {
  return { version: VERSION, lemmas: {} }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function normalizePractice(value) {
  const source = isObject(value) ? value : {}
  const lemmas = {}

  if (isObject(source.lemmas)) {
    for (const [lemmaId, rawSlots] of Object.entries(source.lemmas)) {
      if (!lemmaId || !isObject(rawSlots)) continue
      const slots = {}
      for (const [slot, raw] of Object.entries(rawSlots)) {
        if (!slot || !isObject(raw)) continue
        const seen = Math.max(0, Math.round(Number(raw.seen) || 0))
        const correct = Math.max(0, Math.round(Number(raw.correct) || 0))
        const wrong = Math.max(0, Math.round(Number(raw.wrong) || 0))
        if (!seen && !correct && !wrong) continue
        slots[slot] = {
          seen,
          correct,
          wrong,
          last: Number(raw.last) || 0,
        }
      }
      if (Object.keys(slots).length) lemmas[lemmaId] = slots
    }
  }

  return { version: VERSION, lemmas }
}

export function readPractice() {
  if (typeof window === 'undefined') return emptyPractice()
  try {
    const raw = window.localStorage.getItem(PARADIGM_PRACTICE_KEY)
    return raw === null ? emptyPractice() : normalizePractice(JSON.parse(raw))
  } catch {
    return emptyPractice()
  }
}

export function writePractice(value) {
  const next = normalizePractice(value)
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(PARADIGM_PRACTICE_KEY, JSON.stringify(next))
    } catch {
      /* Practice should never break the page. */
    }
  }
  return next
}

export function recordPracticeResult(practice, lemmaId, slot, correct) {
  if (!lemmaId || !slot) return practice
  const current = normalizePractice(practice)
  const slots = current.lemmas[lemmaId] || (current.lemmas[lemmaId] = {})
  const record = slots[slot] || (slots[slot] = { seen: 0, correct: 0, wrong: 0, last: 0 })
  record.seen += 1
  if (correct) record.correct += 1
  else record.wrong += 1
  record.last = Date.now()
  return writePractice(current)
}

export function practiceStats(practice, lemmaId) {
  return practice?.lemmas?.[lemmaId] || {}
}

export function answerMatches(input, form) {
  return norm(input).trim() === norm(form).trim()
}

function weightFor(entry, stats) {
  const record = stats?.[entry.slot]
  if (!record?.seen) return 1.2
  const wrongRate = record.wrong / Math.max(1, record.seen)
  return 1 + wrongRate * 4
}

function uniqueLabels(entries) {
  const seen = new Set()
  const out = []
  for (const entry of entries) {
    if (!entry.label || seen.has(entry.label)) continue
    seen.add(entry.label)
    out.push(entry)
  }
  return out
}

function shuffle(items) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function pickWeighted(entries, count) {
  const pool = entries.map((entry) => ({ entry, weight: entry.weight }))
  const picked = []
  const limit = Math.min(count, pool.length)

  while (picked.length < limit && pool.length) {
    const total = pool.reduce((sum, item) => sum + item.weight, 0)
    let cursor = Math.random() * total
    let index = 0
    while (index < pool.length - 1 && cursor > pool[index].weight) {
      cursor -= pool[index].weight
      index += 1
    }
    picked.push(pool[index].entry)
    pool.splice(index, 1)
  }
  return picked
}

/** Build a mixed session of form and parse questions, weighted to weak slots. */
export function buildPracticeQuestions(entries, stats = {}, count = 10) {
  const usable = (entries || []).filter(
    (entry) => entry?.form && entry?.slot && entry?.label,
  )
  if (!usable.length) return []

  const formCounts = new Map()
  for (const entry of usable) {
    const key = norm(entry.form)
    formCounts.set(key, (formCounts.get(key) || 0) + 1)
  }

  const weighted = usable.map((entry) => ({
    entry,
    weight: weightFor(entry, stats),
    canParse: usable.length >= 4 && formCounts.get(norm(entry.form)) === 1,
  }))

  return pickWeighted(weighted, count).map(({ entry, canParse }) => {
    const type = canParse && Math.random() < 0.45 ? 'parse' : 'form'

    if (type === 'parse') {
      const distractors = shuffle(
        uniqueLabels(usable.filter((item) => item.slot !== entry.slot)),
      ).slice(0, 3)
      const choices = shuffle([entry, ...distractors]).map((item) => ({
        slot: item.slot,
        label: item.label,
      }))
      return {
        type: 'parse',
        entry,
        choices,
        answerSlot: entry.slot,
        answerLabel: entry.label,
      }
    }

    return {
      type: 'form',
      entry,
      answer: entry.form,
      answerLabel: entry.label,
    }
  })
}

/** The slots that have caused the most trouble, worst first. */
export function weakSlots(stats, entries, limit = 4) {
  return (entries || [])
    .map((entry) => ({ entry, record: stats?.[entry.slot] }))
    .filter(({ record }) => record?.wrong > 0)
    .sort((a, b) => {
      const rateA = a.record.wrong / Math.max(1, a.record.seen)
      const rateB = b.record.wrong / Math.max(1, b.record.seen)
      return rateB - rateA || b.record.wrong - a.record.wrong
    })
    .slice(0, limit)
    .map(({ entry, record }) => ({ ...entry, record }))
}
