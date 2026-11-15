import { describe, expect, it } from 'vitest'
import {
  emptyHodieSession,
  normalizeHodieSession,
} from './hodie-session.js'

const day = new Date(2026, 10, 15).getTime()

describe('normalizeHodieSession', () => {
  it('keeps the day, drill, and reading', () => {
    const session = normalizeHodieSession(
      {
        day: '2026-11-15',
        drill: { done: true, correct: 4, total: 5, lemmaId: 'ripa' },
        reading: {
          bookId: 'familia-romana',
          number: 1,
          href: '/library/familia-romana/imperium-romanum',
          label: 'Familia Romana I — The Roman Empire',
        },
      },
      day,
    )

    expect(session.day).toBe('2026-11-15')
    expect(session.drill).toMatchObject({
      done: true,
      correct: 4,
      total: 5,
      lemmaId: 'ripa',
    })
    expect(session.reading).toMatchObject({
      bookId: 'familia-romana',
      number: 1,
    })
  })

  it('resets when the stored day is not today', () => {
    const session = normalizeHodieSession(
      {
        day: '2026-11-14',
        drill: { done: true, correct: 5, total: 5 },
      },
      day,
    )
    expect(session).toEqual(emptyHodieSession(day))
  })

  it('drops a reading without the fields the session needs', () => {
    const session = normalizeHodieSession(
      {
        day: '2026-11-15',
        reading: { bookId: 'familia-romana', number: 1 },
      },
      day,
    )
    expect(session.reading).toBeNull()
  })
})
