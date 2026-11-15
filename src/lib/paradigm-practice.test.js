import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  answerMatches,
  buildPracticeQuestions,
  normalizePractice,
  weakSlots,
} from './paradigm-practice.js'

const entries = [
  { form: 'rīpa', slot: 'N|NOM|S|F', label: 'nominative singular feminine' },
  { form: 'rīpam', slot: 'N|ACC|S|F', label: 'accusative singular feminine' },
  { form: 'rīpae', slot: 'N|GEN|S|F', label: 'genitive singular feminine' },
  { form: 'rīpīs', slot: 'N|DAT|P|F', label: 'dative plural feminine' },
]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('answerMatches', () => {
  it('ignores macra, case, and surrounding space', () => {
    expect(answerMatches('ripam', 'rīpam')).toBe(true)
    expect(answerMatches('  RĪPAM ', 'rīpam')).toBe(true)
    expect(answerMatches('ripas', 'rīpam')).toBe(false)
  })
})

describe('buildPracticeQuestions', () => {
  it('builds one question per selected slot', () => {
    const questions = buildPracticeQuestions(entries, {}, 3)
    const slots = questions.map((question) => question.entry.slot)
    expect(questions).toHaveLength(3)
    expect(new Set(slots).size).toBe(3)
  })

  it('includes the correct choice in a parse question', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const questions = buildPracticeQuestions(entries, {}, 4)
    const parse = questions.find((question) => question.type === 'parse')

    expect(parse).toBeTruthy()
    expect(parse.choices.some((choice) => choice.slot === parse.answerSlot)).toBe(true)
  })

  it('falls back to form questions when a form is shared by several slots', () => {
    const shared = [
      { form: 'rīpa', slot: 'N|NOM|S|F', label: 'nominative singular feminine' },
      { form: 'rīpa', slot: 'N|VOC|S|F', label: 'vocative singular feminine' },
    ]
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const questions = buildPracticeQuestions(shared, {}, 2)
    expect(questions.every((question) => question.type === 'form')).toBe(true)
  })
})

describe('weakSlots', () => {
  it('puts the slots with the highest miss rate first', () => {
    const stats = {
      'N|NOM|S|F': { seen: 5, wrong: 1 },
      'N|ACC|S|F': { seen: 4, wrong: 3 },
      'N|GEN|S|F': { seen: 2, wrong: 2 },
    }
    expect(weakSlots(stats, entries).map((entry) => entry.slot)).toEqual([
      'N|GEN|S|F',
      'N|ACC|S|F',
      'N|NOM|S|F',
    ])
  })
})

describe('normalizePractice', () => {
  it('keeps valid records and drops malformed ones', () => {
    const value = normalizePractice({
      lemmas: {
        ripa: {
          'N|ACC|S|F': { seen: 2, correct: 1, wrong: 1, last: 5 },
          broken: { seen: 0 },
        },
      },
    })
    expect(value.lemmas.ripa['N|ACC|S|F']).toMatchObject({
      seen: 2,
      correct: 1,
      wrong: 1,
    })
    expect(value.lemmas.ripa.broken).toBeUndefined()
  })
})
