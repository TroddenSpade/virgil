import { describe, expect, it } from 'vitest'
import {
  CURATED_HEAD_FIXES,
  headwordOf,
  isDenylisted,
  posFromGroup,
} from '../../scripts/vocabulary.mjs'

describe('vocabulary row parsing', () => {
  it('prefers the leading parenthetical lemma', () => {
    expect(headwordOf('(dicitō) dicitāre')).toBe('dicitō')
    expect(headwordOf('(sepeliō) -elīre, -elīvisse, -ultum')).toBe('sepeliō')
    expect(headwordOf('(crēdō) crēdere, -didisse, -ditum')).toBe('crēdō')
  })

  it('rejects stray principal-part suffixes', () => {
    expect(headwordOf('-ectum')).toBe('')
    expect(headwordOf('-tactum')).toBe('')
    expect(headwordOf('-ne')).toBe('-ne')
  })

  it('uses the Companion group when there is no pos', () => {
    expect(posFromGroup('Adverbia (Adverbs)')).toBe('adverb')
    expect(posFromGroup('Verba (Verbs) — -ere')).toBe('verb')
    expect(posFromGroup('Nōmina (Nouns) — 3rd', 'pāstiō, -ōnis ( f.)')).toBe('noun (f.)')
    expect(posFromGroup('1st/2nd (‑us/er, ‑a, ‑um)', 'centēsimus, -a, -um')).toBe(
      'adjective',
    )
  })

  it('records the illicō printing correction and the OCR denylist', () => {
    expect(CURATED_HEAD_FIXES.get('illico')?.head).toBe('illiciō')
    expect(
      isDenylisted('petronius-cena-trimalchionis', 1, 'argfimentum'),
    ).toBe(true)
    expect(isDenylisted('petronius-cena-trimalchionis', 1, 'argumentum')).toBe(false)
  })
})
