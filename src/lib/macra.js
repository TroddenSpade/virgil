// Client-side helpers for the editorial-macra note and the report link.
//
// The override manifest is small and safe to bundle: the note needs the
// reviewed corrections for one book, and the report link only needs the
// repository address. The actual text corrections are applied at build time,
// never in the browser.
import manifest from '../data/macra-overrides.json'

export const MACRA_ISSUE_URL = 'https://github.com/TroddenSpade/virgil/issues/new'

export function correctionsForBook(bookSlug) {
  if (!bookSlug) return []
  const corrections = Array.isArray(manifest.corrections) ? manifest.corrections : []
  return corrections.filter((correction) => correction.book === bookSlug)
}

function issueTitle({ book, chapter, word }) {
  const parts = ['[macron]']
  if (book) parts.push(book)
  if (chapter) parts.push(chapter)
  if (word) parts.push(`— ${word}`)
  return parts.join(' ')
}

/**
 * A prefilled GitHub issue for a suspected macron error.
 *
 * Everything is URL-encoded; the body is kept short enough for the usual
 * browser and GitHub limits. Fields are optional, so the same helper serves a
 * word page, a reading page and the note on the text.
 */
export function macraReportHref({
  book = '',
  chapter = '',
  reading = '',
  word = '',
  current = '',
  suggestion = '',
  page = '',
} = {}) {
  // A dictionary example can be a whole sentence; keep the issue URL (and
  // the issue body) readable. The reporter can paste the rest by hand.
  const shorten = (value, limit = 320) => {
    const text = String(value || '').trim()
    return text.length > limit ? `${text.slice(0, limit - 1)}…` : text
  }

  const lines = [
    '**Where**',
    `- Book: ${book || '—'}`,
    `- Chapter: ${chapter || '—'}`,
    `- Reading: ${reading || '—'}`,
    `- Word/form: ${word || '—'}`,
    `- Page: ${page || '—'}`,
    '',
    '**Current text**',
    current ? `> ${shorten(current)}` : '> ',
    '',
    '**Suggested correction**',
    suggestion ? `> ${shorten(suggestion)}` : '> ',
    '',
    '_Reported from the Virgil macron review. Please quote the surrounding sentence if the quantity depends on the context._',
  ]

  const url = new URL(MACRA_ISSUE_URL)
  url.searchParams.set('title', issueTitle({ book, chapter, word }))
  url.searchParams.set('body', lines.join('\n'))
  return url.toString()
}
