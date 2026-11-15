import { describe, expect, it } from 'vitest'
import { dictionaryKey, dictionaryKeys, norm, wordHref } from './dictionary.js'

describe('dictionaryKey', () => {
  it('keeps a plain headword', () => {
    expect(dictionaryKey('rīpa')).toBe('rīpa')
  })

  it('drops the hyphen on an enclitic', () => {
    expect(dictionaryKey('-ne')).toBe('ne')
    expect(dictionaryKey('-que')).toBe('que')
  })

  it('drops a trailing question or exclamation mark', () => {
    expect(dictionaryKey('quid?')).toBe('quid')
    expect(dictionaryKey('age!')).toBe('age')
    expect(dictionaryKey('ō!')).toBe('ō')
  })

  it('takes the first form of a compound interrogative', () => {
    expect(dictionaryKey('quis? quae? quid?')).toBe('quis')
    expect(dictionaryKey('quālis? quāle?')).toBe('quālis')
  })

  it('drops a stray closing quote', () => {
    expect(dictionaryKey('ain’')).toBe('ain')
  })

  it('keeps an ellipsis phrase whole', () => {
    expect(dictionaryKey('nōn sōlum ... sed etiam')).toBe(
      'nōn sōlum ... sed etiam',
    )
  })

  it('keeps a colon phrase whole', () => {
    expect(dictionaryKey('citrō: ultrō citrōque')).toBe(
      'citrō: ultrō citrōque',
    )
  })

  it('collapses whitespace and handles empty input', () => {
    expect(dictionaryKey('  rēs   pūblica ')).toBe('rēs pūblica')
    expect(dictionaryKey('')).toBe('')
    expect(dictionaryKey(null)).toBe('')
  })
})

describe('dictionaryKeys', () => {
  it('adds the first word as a fallback for a phrase', () => {
    expect(dictionaryKeys('salvēre iubeō')).toEqual([
      'salvēre iubeō',
      'salvēre',
    ])
  })

  it('does not repeat the key for a single word', () => {
    expect(dictionaryKeys('quid?')).toEqual(['quid'])
  })

  it('returns nothing for empty input', () => {
    expect(dictionaryKeys('')).toEqual([])
  })
})

describe('wordHref', () => {
  it('encodes the headword', () => {
    expect(wordHref('rīpa')).toBe('/dictionary/r%C4%ABpa')
    expect(wordHref('aquae ductus')).toBe('/dictionary/aquae%20ductus')
  })

  it('links punctuation heads to their lexicon entry', () => {
    expect(wordHref('quid?')).toBe('/dictionary/quid')
    expect(wordHref('age!')).toBe('/dictionary/age')
    expect(wordHref('quis? quae? quid?')).toBe('/dictionary/quis')
    expect(wordHref('-ne')).toBe('/dictionary/ne')
    expect(wordHref('ain’')).toBe('/dictionary/ain')
  })

  it('leaves real phrase entries intact', () => {
    expect(wordHref('nōn sōlum ... sed etiam')).toBe(
      `/dictionary/${encodeURIComponent('nōn sōlum ... sed etiam')}`,
    )
    expect(wordHref('citrō: ultrō citrōque')).toBe(
      `/dictionary/${encodeURIComponent('citrō: ultrō citrōque')}`,
    )
  })

  it('handles an empty headword', () => {
    expect(wordHref('')).toBe('/dictionary/')
    expect(wordHref(undefined)).toBe('/dictionary/')
  })
})

describe('norm', () => {
  it('folds macra, case, and ligatures', () => {
    expect(norm('RĪPA')).toBe('ripa')
    expect(norm('æquus')).toBe('aequus')
    expect(norm('Iūlius')).toBe('iulius')
  })
})
