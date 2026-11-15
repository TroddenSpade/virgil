import { describe, expect, it } from 'vitest'
import { caesarBook, familiaRomanaBook } from '../data/library.js'
import {
  buildWordlist,
  cleanText,
  headwordOf,
  readingWordKey,
  wordKey,
} from './wordlist.js'

describe('cleanText', () => {
  it('removes the source print tags', () => {
    expect(cleanText('{i}often pl.{/i}')).toBe('often pl.')
    expect(cleanText('{b}mare{/b}  {{1}}')).toBe('mare')
  })

  it('collapses whitespace', () => {
    expect(cleanText('  aqua   et   terra ')).toBe('aqua et terra')
  })
})

describe('headwordOf', () => {
  it('takes the nominative before the principal parts', () => {
    expect(headwordOf('capitulum, -ī')).toBe('capitulum')
    expect(headwordOf('rīpa, -ae')).toBe('rīpa')
  })

  it('unwraps the leading headword in parentheses', () => {
    expect(headwordOf('(crēdō) crēdere, -didisse, -ditum')).toBe('crēdō')
  })

  it('takes the first spelling before an equals sign', () => {
    expect(headwordOf('abs = ā, ab')).toBe('abs')
  })

  it('drops a footnote marker', () => {
    expect(headwordOf('iussū2')).toBe('iussū')
  })

  it('keeps true enclitics and rejects stray suffixes', () => {
    expect(headwordOf('-ne')).toBe('-ne')
    expect(headwordOf('-ne?')).toBe('-ne?')
    expect(headwordOf('-que')).toBe('-que')
    expect(headwordOf('-ectum')).toBe('')
  })

  it('rejects empty and markup-only rows', () => {
    expect(headwordOf('')).toBe('')
    expect(headwordOf('{i}{/i}')).toBe('')
  })
})

describe('wordKey', () => {
  it('folds macra and case', () => {
    expect(wordKey('rīpa')).toBe('ripa')
    expect(wordKey('RĪPA')).toBe('ripa')
  })

  it('keeps the enclitic hyphen', () => {
    expect(wordKey('-ne')).toBe('-ne')
    expect(wordKey('nē')).toBe('ne')
  })

  it('folds punctuation into spaces', () => {
    expect(wordKey('aquae ductus')).toBe('aquae ductus')
  })
})

describe('readingWordKey', () => {
  it('keeps dictionary enclitics on their own cards', () => {
    expect(readingWordKey('ne')).toBe('-ne')
    expect(readingWordKey('nē')).toBe('ne')
    expect(readingWordKey('que')).toBe('-que')
    expect(readingWordKey('ve')).toBe('-ve')
  })

  it('finds a key for abbreviation and parser fragments', () => {
    expect(readingWordKey('Cn')).toBe('cn')
    expect(readingWordKey('pr')).toBe('pr')
    expect(readingWordKey('zzz')).toBe('zzz')
  })
})

describe('buildWordlist', () => {
  it('is empty without progress', () => {
    const result = buildWordlist({})
    expect(result.words).toEqual([])
    expect(result.studiedChapters).toBe(0)
    expect(result.contributingChapters).toBe(0)
    expect(result.vocabularyChapters).toBe(0)
  })

  it('gathers printed vocabulary and reading lemmas', () => {
    const result = buildWordlist({
      books: { [familiaRomanaBook.id]: [1, 2, 3] },
    })

    expect(result.studiedChapters).toBe(3)
    expect(result.contributingChapters).toBe(3)
    expect(result.vocabularyChapters).toBe(3)
    expect(result.readingVocabularyChapters).toBe(3)
    expect(result.words.length).toBeGreaterThan(0)
    expect(result.sourceBooks.map((book) => book.id)).toEqual([
      familiaRomanaBook.id,
    ])

    for (const word of result.words) {
      expect(word.key).toBeTruthy()
      expect(word.headword).toBeTruthy()
      expect(word.primarySense).toBeTruthy()
      expect(word.sources.length).toBeGreaterThan(0)
    }
  })

  it('gives every word a unique review key', () => {
    const result = buildWordlist({
      books: { [familiaRomanaBook.id]: [1, 2, 3] },
    })
    const keys = result.words.map((word) => word.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('adds every reading lemma from a learned chapter', () => {
    const reading = {
      lemmas: [
        ['aqua', 'water', 'noun'],
        ['ne', 'question particle', 'particle'],
        ['nē', 'lest', 'conjunction'],
        ['Cn', 'Gnaeus (abbreviation)', 'noun'],
      ],
      chapters: { [`${caesarBook.id}:1`]: [0, 1, 2, 3] },
    }
    const result = buildWordlist(
      { books: { [caesarBook.id]: [1] } },
      reading,
    )

    expect(result.contributingChapters).toBe(1)
    expect(result.vocabularyChapters).toBe(0)
    expect(result.words.map((word) => word.key).sort()).toEqual([
      '-ne',
      'aqua',
      'cn',
      'ne',
    ])
  })

  it('merges a printed word with the same reading lemma', () => {
    const reading = {
      lemmas: [['fluvius', 'river (from the reading)', 'noun']],
      chapters: { [`${familiaRomanaBook.id}:1`]: [0] },
    }
    const result = buildWordlist(
      { books: { [familiaRomanaBook.id]: [1] } },
      reading,
    )
    const word = result.words.find((item) => item.key === 'fluvius')

    expect(word).toBeTruthy()
    expect(word.sources).toHaveLength(1)
    expect(word.sourceCount).toBe(1)
    expect(word.primarySense).toBeTruthy()
  })

  it('uses the reading index for books without printed vocabulary', () => {
    const result = buildWordlist({
      books: { [caesarBook.id]: [1] },
    })
    expect(result.studiedChapters).toBe(1)
    expect(result.vocabularyChapters).toBe(0)
    expect(result.contributingChapters).toBe(1)
    expect(result.readingVocabularyChapters).toBe(1)
    expect(result.words.length).toBeGreaterThan(0)
    expect(result.sourceBooks.map((book) => book.id)).toEqual([caesarBook.id])
  })

  it('accepts a plain map of book id to chapter numbers', () => {
    const result = buildWordlist({ [familiaRomanaBook.id]: [1] })
    expect(result.studiedChapters).toBe(1)
    expect(result.words.length).toBeGreaterThan(0)
  })

  it('adds a hand-saved word once', () => {
    const result = buildWordlist({}, undefined, {
      saved: {
        ripa: {
          key: 'ripa',
          headword: 'rīpa',
          principal: '-ae',
          english: 'bank, shore',
          posGroup: 'noun',
        },
      },
      known: {},
    })

    expect(result.words).toHaveLength(1)
    expect(result.words[0]).toMatchObject({
      key: 'ripa',
      headword: 'rīpa',
      saved: true,
      sourceCount: 1,
    })
    expect(result.savedCount).toBe(1)
  })

  it('does not duplicate a word already in the learned chapters', () => {
    const base = buildWordlist({
      books: { [familiaRomanaBook.id]: [1] },
    })
    const target = base.words[0]
    const result = buildWordlist(
      { books: { [familiaRomanaBook.id]: [1] } },
      undefined,
      {
        saved: {
          [target.key]: {
            key: target.key,
            headword: target.headword,
            principal: target.principal,
            english: target.primarySense,
            posGroup: target.kind,
          },
        },
        known: {},
      },
    )

    const matches = result.words.filter((word) => word.key === target.key)
    expect(matches).toHaveLength(1)
    expect(matches[0].saved).toBe(true)
  })

  it('sets known words aside without removing their saved state', () => {
    const result = buildWordlist({}, undefined, {
      saved: {
        ripa: {
          key: 'ripa',
          headword: 'rīpa',
          principal: '-ae',
          english: 'bank, shore',
          posGroup: 'noun',
        },
      },
      known: { ripa: Date.now() },
    })

    expect(result.words).toHaveLength(0)
    expect(result.knownCount).toBe(1)
  })
})
