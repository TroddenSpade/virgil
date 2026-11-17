import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DIACRITICS,
  HIDDEN_DIACRITICS,
  applyDiacriticsToReading,
  containsDiacritics,
  stripDiacritics,
} from './diacritics.js'

const SAMPLE = 'Ārma virumque canō, aër, ăcer, ácer, a´'

describe('stripDiacritics', () => {
  it('returns the original text when every class is enabled', () => {
    expect(stripDiacritics(SAMPLE, DEFAULT_DIACRITICS)).toBe(SAMPLE)
  })

  it('removes only macrons when that class is off', () => {
    expect(stripDiacritics(SAMPLE, { ...DEFAULT_DIACRITICS, macrons: false })).toBe(
      'Arma virumque cano, aër, ăcer, ácer, a´',
    )
  })

  it('removes breves, diaereses and acutes independently', () => {
    expect(stripDiacritics('ă ë á', { ...DEFAULT_DIACRITICS, breves: false })).toBe('a ë á')
    expect(stripDiacritics('ă ë á', { ...DEFAULT_DIACRITICS, diaereses: false })).toBe('ă e á')
    expect(stripDiacritics('ă ë á', { ...DEFAULT_DIACRITICS, acutes: false })).toBe('ă ë a')
  })

  it('removes standalone apices without touching combining acutes', () => {
    expect(stripDiacritics('á a´', { ...DEFAULT_DIACRITICS, apices: false })).toBe('á a')
  })

  it('removes every controlled mark when all are off', () => {
    expect(stripDiacritics(SAMPLE, HIDDEN_DIACRITICS)).toBe(
      'Arma virumque cano, aer, acer, acer, a',
    )
  })
})

describe('containsDiacritics', () => {
  it('detects precomposed and standalone marks', () => {
    expect(containsDiacritics('ārma')).toBe(true)
    expect(containsDiacritics('a´')).toBe(true)
    expect(containsDiacritics('arma virumque')).toBe(false)
  })
})

describe('applyDiacriticsToReading', () => {
  it('applies the preference to the reading fields only', () => {
    const reading = {
      id: 'carmen',
      latinTitle: 'LĒCTIŌ',
      personae: 'Mārcus, Iūlia',
      paragraphs: ['Ārma virumque canō.'],
      notes: [{ term: 'ārma', gloss: 'arma' }],
    }
    const result = applyDiacriticsToReading(reading, {
      ...DEFAULT_DIACRITICS,
      macrons: false,
    })
    expect(result.id).toBe('carmen')
    expect(result.latinTitle).toBe('LECTIO')
    expect(result.personae).toBe('Marcus, Iulia')
    expect(result.paragraphs).toEqual(['Arma virumque cano.'])
    expect(result.notes).toEqual([{ term: 'arma', gloss: 'arma' }])
  })
})
