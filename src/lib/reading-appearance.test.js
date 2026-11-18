import { describe, expect, it } from 'vitest'
import {
  DEFAULT_READING_APPEARANCE,
  normalizeReadingAppearance,
  readingAppearanceVariables,
  stepReadingScale,
} from './reading-appearance.js'

describe('normalizeReadingAppearance', () => {
  it('falls back for missing or malformed values', () => {
    expect(normalizeReadingAppearance(null)).toEqual(DEFAULT_READING_APPEARANCE)
    expect(
      normalizeReadingAppearance({ scale: 'large', measure: 'enormous' }),
    ).toEqual(DEFAULT_READING_APPEARANCE)
  })

  it('snaps a stored scale to the nearest available step', () => {
    expect(normalizeReadingAppearance({ scale: 0.5 }).scale).toBe(0.9)
    expect(normalizeReadingAppearance({ scale: 1.17 }).scale).toBe(1.2)
    expect(normalizeReadingAppearance({ scale: 2 }).scale).toBe(1.3)
  })

  it('keeps a valid measure', () => {
    expect(normalizeReadingAppearance({ measure: 'narrow' }).measure).toBe('narrow')
  })

  it('defaults the measure to the full available width', () => {
    expect(DEFAULT_READING_APPEARANCE.measure).toBe('wide')
  })
})

describe('stepReadingScale', () => {
  it('moves one step at a time and stops at the ends', () => {
    expect(stepReadingScale({ scale: 1 }, 1)).toBe(1.1)
    expect(stepReadingScale({ scale: 1 }, -1)).toBe(0.9)
    expect(stepReadingScale({ scale: 1.3 }, 1)).toBe(1.3)
    expect(stepReadingScale({ scale: 0.9 }, -1)).toBe(0.9)
  })
})

describe('readingAppearanceVariables', () => {
  it('turns the preference into CSS custom properties', () => {
    const variables = readingAppearanceVariables({ scale: 1.2, measure: 'narrow' })
    expect(variables).toEqual({
      '--reading-scale': '1.2',
      '--reading-measure': '0.78',
    })
  })
})
