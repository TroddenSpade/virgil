import { describe, expect, it } from 'vitest'
import {
  formatParseList,
  parseLabel,
  principalParts,
  qualityKey,
} from './grammar.js'

describe('grammar labels', () => {
  it('labels a noun parse', () => {
    const qual = {
      pofs: 'N',
      noun: { cs: 'ACC', number: 'S', gender: 'F' },
    }
    expect(qualityKey(qual)).toBe('N|ACC|S|F')
    expect(parseLabel(qual)).toBe('accusative singular feminine')
  })

  it('labels a finite verb parse', () => {
    const qual = {
      pofs: 'V',
      verb: {
        tenseVoiceMood: { tense: 'IMPF', voice: 'ACTIVE', mood: 'IND' },
        person: 3,
        number: 'S',
      },
    }
    expect(parseLabel(qual)).toBe(
      'imperfect active indicative, 3rd person singular',
    )
  })

  it('labels a participle with its case and gender', () => {
    const qual = {
      pofs: 'VPAR',
      vpar: {
        cs: 'NOM',
        number: 'S',
        gender: 'M',
        tenseVoiceMood: { tense: 'PERF', voice: 'PASSIVE', mood: 'PPL' },
      },
    }
    expect(parseLabel(qual)).toBe(
      'perfect passive participle nominative singular masculine',
    )
  })

  it('formats an ambiguous nominal label as one group', () => {
    expect(
      formatParseList(
        'nominative singular feminine · vocative singular feminine · ablative singular feminine',
      ),
    ).toBe('nominative, vocative, ablative singular feminine')
  })

  it('keeps differing numbers in separate groups', () => {
    expect(
      formatParseList(
        'genitive singular feminine · dative singular feminine · nominative plural feminine',
      ),
    ).toBe('genitive, dative singular feminine · nominative plural feminine')
  })

  it('leaves verb labels alone', () => {
    expect(
      formatParseList(
        'present active indicative, 1st person singular · present active indicative, 2nd person singular',
      ),
    ).toBe(
      'present active indicative, 1st person singular · present active indicative, 2nd person singular',
    )
  })
})

describe('principalParts', () => {
  it('splits a printed citation', () => {
    expect(principalParts('rīpa, -ae')).toEqual(['rīpa', '-ae'])
    expect(principalParts('amo, amare, amavi, amatus')).toEqual([
      'amo',
      'amare',
      'amavi',
      'amatus',
    ])
  })
})
