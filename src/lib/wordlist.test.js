import { describe, expect, it } from 'vitest'
import { caesarBook, familiaRomanaBook } from '../data/library.js'
import {
  buildWordlist,
  cleanText,
  headwordOf,
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

describe('buildWordlist', () => {
  it('is empty without progress', () => {
    const result = buildWordlist({})
    expect(result.words).toEqual([])
    expect(result.studiedChapters).toBe(0)
    expect(result.vocabularyChapters).toBe(0)
  })

  it('gathers the printed vocabulary of learned chapters', () => {
    const result = buildWordlist({
      books: { [familiaRomanaBook.id]: [1, 2, 3] },
    })

    expect(result.studiedChapters).toBe(3)
    expect(result.vocabularyChapters).toBe(3)
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

  it('counts learned chapters even when they print no vocabulary', () => {
    const result = buildWordlist({
      books: { [caesarBook.id]: [1] },
    })
    expect(result.studiedChapters).toBe(1)
    expect(result.vocabularyChapters).toBe(0)
    expect(result.words).toEqual([])
  })

  it('accepts a plain map of book id to chapter numbers', () => {
    const result = buildWordlist({ [familiaRomanaBook.id]: [1] })
    expect(result.studiedChapters).toBe(1)
    expect(result.words.length).toBeGreaterThan(0)
  })
})
