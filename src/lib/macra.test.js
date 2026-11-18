import { describe, expect, it } from 'vitest'
import manifest from '../data/macra-overrides.json'
import { correctionsForBook, macraReportHref } from './macra.js'
import { applyMacraOverrides } from '../../scripts/macra-overrides.mjs'

describe('macra override manifest', () => {
  it('keeps every correction complete and reviewable', () => {
    for (const correction of manifest.corrections) {
      expect(correction.book, JSON.stringify(correction)).toMatch(/^[a-z0-9-]+$/)
      expect(correction.from, JSON.stringify(correction)).toBeTruthy()
      expect(correction.to, JSON.stringify(correction)).toBeTruthy()
      expect(correction.from).not.toBe(correction.to)
      expect(correction.reason, correction.from).toBeTruthy()
    }
  })

  it('finds the reviewed Gallia correction for Caesar', () => {
    const corrections = correctionsForBook('caesar-de-bello-gallico')
    expect(corrections.some((entry) => entry.to === 'Gallia est omnis')).toBe(true)
  })
})

describe('applyMacraOverrides', () => {
  it('replaces a reviewed phrase without touching other occurrences', () => {
    const text = 'Galliā est omnīs dīvīsa in partēs; in Galliā est cōpia.'
    const result = applyMacraOverrides('caesar-de-bello-gallico', text)
    expect(result).toContain('Gallia est omnis dīvīsa')
    expect(result).toContain('in Galliā est cōpia')
  })

  it('leaves other books alone', () => {
    const text = 'Galliā est omnīs'
    expect(applyMacraOverrides('vergil-aeneis', text)).toBe(text)
  })
})

describe('macraReportHref', () => {
  it('builds a prefilled GitHub issue', () => {
    const href = macraReportHref({
      book: 'Caesar: De Bello Gallico',
      chapter: 'I',
      word: 'Galliā',
      current: 'Galliā est omnīs',
      suggestion: 'Gallia est omnis',
      page: '/library/caesar-de-bello-gallico/liber-i-1',
    })
    const url = new URL(href)

    expect(url.origin).toBe('https://github.com')
    expect(url.pathname).toBe('/TroddenSpade/virgil/issues/new')
    expect(url.searchParams.get('title')).toContain('[macron]')
    expect(url.searchParams.get('body')).toContain('Galliā est omnīs')
    expect(url.searchParams.get('body')).toContain('Gallia est omnis')
  })
})
