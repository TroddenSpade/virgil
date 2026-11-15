import { describe, expect, it } from 'vitest'
import { familiaRomanaBook } from '../data/library.js'
import {
  normalizeStudy,
  studyDocument,
  studyFingerprint,
} from './study-sync.js'

const saved = (addedAt) => ({
  version: 1,
  saved: {
    ripa: {
      key: 'ripa',
      headword: 'rīpa',
      principal: '-ae',
      english: 'bank, shore',
      posGroup: 'noun',
      form: 'rīpā',
      source: null,
      addedAt,
    },
  },
  known: { urbs: addedAt },
})

const review = (seen = 1) => ({
  version: 1,
  words: {
    ripa: {
      box: 1,
      due: 0,
      seen,
      correct: seen,
      streak: seen,
      lapses: 0,
      last: 0,
    },
  },
  days: {},
  settings: { newPerSession: 20 },
})

const document = (addedAt = 1, seen = 1) => ({
  version: 1,
  books: { [familiaRomanaBook.id]: [1] },
  progress: {
    version: 1,
    books: { [familiaRomanaBook.id]: [1] },
  },
  savedWords: saved(addedAt),
  review: review(seen),
})

describe('normalizeStudy', () => {
  it('accepts the old top-level progress shape', () => {
    const study = normalizeStudy({
      version: 1,
      books: { [familiaRomanaBook.id]: [6, 1, 6] },
    })
    expect(study.progress.books[familiaRomanaBook.id]).toEqual([1, 6])
    expect(study.savedWords.saved).toEqual({})
    expect(study.review.words).toEqual({})
  })

  it('reads the full study document', () => {
    const study = normalizeStudy(document())
    expect(study.savedWords.saved.ripa.headword).toBe('rīpa')
    expect(study.review.words.ripa.seen).toBe(1)
  })
})

describe('studyFingerprint', () => {
  it('ignores saved and known timestamps', () => {
    expect(studyFingerprint(document(1, 1))).toBe(studyFingerprint(document(99, 1)))
  })

  it('changes when review history changes', () => {
    expect(studyFingerprint(document(1, 1))).not.toBe(
      studyFingerprint(document(1, 4)),
    )
  })
})

describe('studyDocument', () => {
  it('keeps a top-level books copy for older clients', () => {
    const doc = studyDocument(document())
    expect(doc.books[familiaRomanaBook.id]).toEqual([1])
    expect(doc.progress.books[familiaRomanaBook.id]).toEqual([1])
    expect(doc.savedWords.saved.ripa.headword).toBe('rīpa')
  })
})
