import { describe, expect, it } from 'vitest'
import {
  AGAIN_MS,
  BOX_INTERVALS,
  DAY_MS,
  DEFAULT_NEW_PER_SESSION,
  MAX_BOX,
  buildSession,
  dueFor,
  emptyReview,
  intervalLabel,
  normalizeReview,
  rateReview,
  reviewStats,
  statusOf,
} from './review.js'

const NOW = 1_700_000_000_000

function word(key, order, headword = key) {
  return { key, headword, order }
}

function reviewWith(words) {
  return {
    ...emptyReview(),
    words,
  }
}

describe('normalizeReview', () => {
  it('returns a clean document for junk input', () => {
    expect(normalizeReview(null)).toEqual(emptyReview())
    expect(normalizeReview('nope')).toEqual(emptyReview())
    expect(normalizeReview({ words: [] })).toEqual(emptyReview())
  })

  it('clamps word state and keeps real history', () => {
    const result = normalizeReview({
      words: {
        rīpa: {
          box: 999,
          seen: 2,
          due: 5,
          correct: -4,
          streak: '3',
          lapses: 1,
          last: 10,
        },
      },
      settings: { newPerSession: 999 },
    })

    expect(result.words.rīpa).toEqual({
      box: MAX_BOX,
      due: 5,
      seen: 2,
      correct: 0,
      streak: 3,
      lapses: 1,
      last: 10,
    })
    expect(result.settings.newPerSession).toBe(100)
  })

  it('drops empty rows and malformed keys', () => {
    const result = normalizeReview({
      words: {
        '': { seen: 1 },
        aqua: { seen: 0, box: 0, due: 0 },
        terra: { seen: 1, box: 0, due: Number.NaN },
      },
    })
    expect(result.words).toEqual({
      terra: {
        box: 0,
        due: 0,
        seen: 1,
        correct: 0,
        streak: 0,
        lapses: 0,
        last: 0,
      },
    })
  })

  it('keeps newPerSession inside the allowed range', () => {
    expect(normalizeReview({ settings: { newPerSession: 1 } }).settings.newPerSession).toBe(5)
    expect(normalizeReview({ settings: { newPerSession: 'x' } }).settings.newPerSession).toBe(
      DEFAULT_NEW_PER_SESSION,
    )
  })
})

describe('rateReview', () => {
  it('advances a new word one box on "good"', () => {
    const result = rateReview(emptyReview(), 'aqua', 'good', NOW)
    expect(result.words.aqua).toEqual({
      box: 1,
      due: NOW + DAY_MS,
      seen: 1,
      correct: 1,
      streak: 1,
      lapses: 0,
      last: NOW,
    })
  })

  it('sends "again" back to the start and counts the lapse', () => {
    const review = reviewWith({
      aqua: {
        box: 4,
        due: NOW,
        seen: 10,
        correct: 8,
        streak: 6,
        lapses: 1,
        last: NOW - DAY_MS,
      },
    })
    const result = rateReview(review, 'aqua', 'again', NOW)
    expect(result.words.aqua).toMatchObject({
      box: 0,
      due: NOW + AGAIN_MS,
      seen: 11,
      correct: 8,
      streak: 0,
      lapses: 2,
    })
  })

  it('jumps two boxes on "easy"', () => {
    const result = rateReview(emptyReview(), 'aqua', 'easy', NOW)
    expect(result.words.aqua.box).toBe(2)
    expect(result.words.aqua.due).toBe(NOW + 3 * DAY_MS)
  })

  it('never lowers the box on "hard"', () => {
    const review = reviewWith({
      aqua: {
        box: 5,
        due: NOW,
        seen: 1,
        correct: 1,
        streak: 1,
        lapses: 0,
        last: NOW,
      },
    })
    const result = rateReview(review, 'aqua', 'hard', NOW)
    expect(result.words.aqua.box).toBe(5)
    expect(result.words.aqua.due).toBe(NOW + DAY_MS)
  })

  it('does not mutate the previous review', () => {
    const review = emptyReview()
    rateReview(review, 'aqua', 'good', NOW)
    expect(review.words).toEqual({})
  })
})

describe('dueFor', () => {
  it('uses the box interval for a correct answer', () => {
    expect(dueFor('good', 0, NOW)).toBe(NOW + BOX_INTERVALS[1] * DAY_MS)
    expect(dueFor('easy', 0, NOW)).toBe(NOW + BOX_INTERVALS[2] * DAY_MS)
  })

  it('brings a missed word back within the session', () => {
    expect(dueFor('again', 3, NOW)).toBe(NOW + AGAIN_MS)
  })
})

describe('statusOf', () => {
  it('labels new, due, learning, and mature words', () => {
    expect(statusOf(null, NOW).key).toBe('new')
    expect(statusOf({ seen: 1, due: NOW - 1, box: 1 }, NOW).key).toBe('due')
    expect(statusOf({ seen: 1, due: NOW + DAY_MS, box: 2 }, NOW).key).toBe('learning')
    expect(statusOf({ seen: 1, due: NOW + DAY_MS, box: 3 }, NOW).key).toBe('mature')
  })
})

describe('buildSession', () => {
  const words = [word('a', 0), word('b', 1), word('c', 2)]
  const review = reviewWith({
    a: { box: 1, due: NOW - 60_000, seen: 3, correct: 2, streak: 1, lapses: 0, last: NOW - DAY_MS },
    b: { box: 3, due: NOW + DAY_MS, seen: 4, correct: 4, streak: 4, lapses: 0, last: NOW - DAY_MS },
  })

  it('puts due words before new ones in mixed mode', () => {
    expect(buildSession(words, review, 'mixed', NOW, 20).map((item) => item.key)).toEqual([
      'a',
      'c',
    ])
  })

  it('returns only due words in due mode', () => {
    expect(buildSession(words, review, 'due', NOW, 20).map((item) => item.key)).toEqual(['a'])
  })

  it('returns only new words in new mode', () => {
    expect(buildSession(words, review, 'new', NOW, 20).map((item) => item.key)).toEqual(['c'])
  })

  it('caps the new words in a mixed session', () => {
    expect(buildSession(words, review, 'mixed', NOW, 0).map((item) => item.key)).toEqual(['a'])
  })
})

describe('reviewStats', () => {
  const words = [word('a', 0), word('b', 1), word('c', 2)]

  it('summarises the list', () => {
    const stats = reviewStats(
      words,
      reviewWith({
        a: { box: 1, due: NOW - 1, seen: 1, correct: 1, streak: 1, lapses: 0, last: NOW },
        b: { box: 3, due: NOW + DAY_MS, seen: 1, correct: 1, streak: 1, lapses: 0, last: NOW },
      }),
      NOW,
    )

    expect(stats).toMatchObject({
      total: 3,
      due: 1,
      new: 1,
      learning: 0,
      mature: 1,
      reviewed: 2,
      percentReviewed: 67,
    })
  })

  it('reports zero percent for an empty list', () => {
    expect(reviewStats([], emptyReview(), NOW).percentReviewed).toBe(0)
  })
})

describe('intervalLabel', () => {
  it('describes the next interval in words', () => {
    expect(intervalLabel('again', { box: 0 })).toBe('10 min')
    expect(intervalLabel('hard', { box: 0 })).toBe('1 day')
    expect(intervalLabel('good', { box: 0 })).toBe('1 day')
    expect(intervalLabel('easy', { box: 0 })).toBe('3 days')
  })
})
