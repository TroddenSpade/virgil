import { ISSUE_URL } from './issues.js'

/**
 * A prefilled GitHub issue for an ordinary text problem: a typo, a missing
 * word, a bad line break or an OCR slip. Macra have their own report helper;
 * this one quotes the reading so the editor can find the line without guessing.
 */
export function textReportHref({
  book = '',
  chapter = '',
  section = '',
  page = '',
  quote = '',
} = {}) {
  const shorten = (value, limit = 320) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim()
    return text.length > limit ? `${text.slice(0, limit - 1)}…` : text
  }

  const lines = [
    '**Where**',
    `- Book: ${book || '—'}`,
    `- Chapter: ${chapter || '—'}`,
    `- Section: ${section || '—'}`,
    `- Page: ${page || '—'}`,
    '',
    '**Quoted line**',
    quote ? `> ${shorten(quote)}` : '> ',
    '',
    '**What looks wrong**',
    '<!-- A typo, a missing word, a bad line break, an OCR slip… -->',
    '',
    '_Reported from Virgil. The quoted line above is copied from the reading._',
  ]

  const title = ['[text]', book, chapter, section ? `— ${section}` : '']
    .filter(Boolean)
    .join(' ')
  const safeTitle = title.length > 160 ? `${title.slice(0, 159)}…` : title

  const url = new URL(ISSUE_URL)
  url.searchParams.set('title', safeTitle)
  url.searchParams.set('body', lines.join('\n'))
  return url.toString()
}

/** Turn a route path into the absolute URL a GitHub issue can link to. */
export function absolutePageUrl(page, origin = '') {
  const value = String(page || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (!origin) return value
  return `${origin.replace(/\/+$/, '')}/${value.replace(/^\/+/, '')}`
}
