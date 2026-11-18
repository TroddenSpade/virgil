import { describe, expect, it } from 'vitest'
import { absolutePageUrl, textReportHref } from './text-report.js'

describe('textReportHref', () => {
  it('builds a prefilled GitHub issue with the passage and its place', () => {
    const href = textReportHref({
      book: 'Familia Romana',
      chapter: 'I — The Roman Empire',
      section: 'Lēctiō (reading)',
      page: 'https://virgil.parsasam.ir/library/familia-romana/imperium-romanum#lectio',
      quote: 'Rōma in Italiā est.',
    })
    const url = new URL(href)

    expect(url.origin).toBe('https://github.com')
    expect(url.pathname).toBe('/TroddenSpade/virgil/issues/new')

    const title = url.searchParams.get('title')
    expect(title).toContain('[text]')
    expect(title).toContain('Familia Romana')
    expect(title).toContain('Lēctiō')

    const body = url.searchParams.get('body')
    expect(body).toContain('Familia Romana')
    expect(body).toContain('I — The Roman Empire')
    expect(body).toContain('Lēctiō (reading)')
    expect(body).toContain('https://virgil.parsasam.ir/library/familia-romana/imperium-romanum#lectio')
    expect(body).toContain('> Rōma in Italiā est.')
  })

  it('shortens a very long quoted line', () => {
    const quote = 'Rōma '.repeat(200)
    const url = new URL(textReportHref({ book: 'Test', quote }))
    const body = url.searchParams.get('body')
    const quoted = body.split('\n').find((line) => line.startsWith('> Rōma'))
    expect(quoted.length).toBeLessThanOrEqual(322)
    expect(quoted.endsWith('…')).toBe(true)
  })
})

describe('absolutePageUrl', () => {
  it('joins a route path to the site origin', () => {
    expect(absolutePageUrl('/library/book#section', 'https://virgil.parsasam.ir')).toBe(
      'https://virgil.parsasam.ir/library/book#section',
    )
  })

  it('leaves absolute URLs and missing origins alone', () => {
    expect(absolutePageUrl('https://example.com/page', 'https://virgil.parsasam.ir')).toBe(
      'https://example.com/page',
    )
    expect(absolutePageUrl('/library/book')).toBe('/library/book')
    expect(absolutePageUrl('')).toBe('')
  })
})
