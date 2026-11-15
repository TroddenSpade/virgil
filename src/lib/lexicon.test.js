import { describe, expect, it } from 'vitest'
import {
  buildLexiconIndex,
  latinTokens,
  lookupLexicon,
  parseReadingMarkup,
} from './lexicon.js'

describe('latinTokens', () => {
  it('keeps words and the punctuation between them', () => {
    expect(latinTokens('Rōma in Italiā est.')).toEqual([
      { type: 'word', value: 'Rōma' },
      { type: 'text', value: ' ' },
      { type: 'word', value: 'in' },
      { type: 'text', value: ' ' },
      { type: 'word', value: 'Italiā' },
      { type: 'text', value: ' ' },
      { type: 'word', value: 'est' },
      { type: 'text', value: '.' },
    ])
  })

  it('keeps ligatures and proper names whole', () => {
    expect(latinTokens('Ægyptus et coepit').filter((t) => t.type === 'word')).toEqual([
      { type: 'word', value: 'Ægyptus' },
      { type: 'word', value: 'et' },
      { type: 'word', value: 'coepit' },
    ])
  })
})

describe('parseReadingMarkup', () => {
  it('carries italic state and turns note references into notes', () => {
    expect(parseReadingMarkup('{i}Rōma{/i} in Italiā {{3}} est.')).toEqual([
      { type: 'text', value: 'Rōma', italic: true, bold: false },
      { type: 'text', value: ' in Italiā ', italic: false, bold: false },
      { type: 'note', value: '3' },
      { type: 'text', value: ' est.', italic: false, bold: false },
    ])
  })

  it('handles the broken-looking inline tags found in the readers', () => {
    const nodes = parseReadingMarkup('S{i}u{/i}ria, nōn S{i}i{/i}ria')
    expect(nodes.map((node) => node.value).join('')).toBe('Suria, nōn Siria')
    expect(nodes.filter((node) => node.type === 'text').map((node) => node.italic)).toEqual([
      false,
      true,
      false,
      true,
      false,
    ])
  })

  it('never leaves markup in the readable text', () => {
    const nodes = parseReadingMarkup('{b}Arma{/b} virumque {{12}} canō')
    expect(nodes.map((node) => (node.type === 'text' ? node.value : '')).join('')).toBe(
      'Arma virumque  canō',
    )
    expect(nodes.some((node) => node.value.includes('{'))).toBe(false)
  })
})

describe('lexicon index', () => {
  const data = {
    lemmas: [
      {
        id: 'ripa',
        headword: 'rīpa',
        english: 'bank, shore',
        pos: 'noun',
        posGroup: 'noun',
      },
      {
        id: 'roma',
        headword: 'Rōma',
        english: 'Rome',
        pos: 'noun',
        posGroup: 'noun',
      },
    ],
    words: [
      { w: 'rīpam', l: 'ripa' },
      { w: 'Rōma', l: 'roma' },
    ],
  }

  const index = buildLexiconIndex(data)

  it('resolves an inflected form to its lemma', () => {
    expect(lookupLexicon(index, 'ripam')).toMatchObject({
      form: 'rīpam',
      fromLemma: false,
      lemma: { id: 'ripa' },
    })
  })

  it('folds case and macra when looking a word up', () => {
    expect(lookupLexicon(index, 'ROMA')).toMatchObject({
      form: 'Rōma',
      lemma: { id: 'roma' },
    })
  })

  it('falls back to a headword outside the indexed forms', () => {
    expect(lookupLexicon(index, 'rīpa')).toMatchObject({
      form: 'rīpa',
      fromLemma: true,
      lemma: { id: 'ripa' },
    })
  })

  it('returns nothing for a word outside the lexicon', () => {
    expect(lookupLexicon(index, 'zzzz')).toBeNull()
    expect(lookupLexicon(null, 'rīpa')).toBeNull()
  })
})
