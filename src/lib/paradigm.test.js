import { describe, expect, it } from 'vitest'
import { hasParadigm } from './paradigm.js'

describe('hasParadigm', () => {
  it('shows a paradigm for inflected parts of speech', () => {
    expect(hasParadigm({ sig: 'N|1.1|F|P' })).toBe(true)
    expect(hasParadigm({ sig: 'V|1.1|X' })).toBe(true)
    expect(hasParadigm({ sig: 'ADJ|3.2|POS' })).toBe(true)
    expect(hasParadigm({ sig: 'PRON|3.1|ADJECT' })).toBe(true)
  })

  it('hides it for indeclinable words', () => {
    expect(hasParadigm({ sig: 'ADV|X' })).toBe(false)
    expect(hasParadigm({ sig: 'PREP|ABL' })).toBe(false)
    expect(hasParadigm({ sig: null })).toBe(false)
    expect(hasParadigm(null)).toBe(false)
  })
})
