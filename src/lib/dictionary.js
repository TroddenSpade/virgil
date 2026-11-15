// Shared helpers for the /dictionary lexicon.
//
// The lexicon is loaded lazily from src/data/dictionary.generated.js. Its
// entries are shaped:
//   { id, latin, headword, letter, pos, posGroup, english,
//     sources: [{ book, bookSlug }],
//     examples: [{ latin, book, bookSlug }] }
// Example sentences mark the word's form with {{...}}.

// Fold macra and case so that "rīpa" and "ripa" are the same headword.
export const norm = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/j/g, 'i')
    .toLowerCase()

// Every word carries a meaning, but the generator marks the forms it could
// not gloss with a bracketed placeholder. Treat those as "undefined".
export function hasDefinition(english) {
  const text = (english || '').trim()
  return text.length > 0 && !text.startsWith('[Auto-extracted')
}

// All words come from a single book; link it to the library.
export function bookHref(source) {
  return source?.bookSlug ? `/library/${source.bookSlug}` : '/library'
}

// The exact chapter a word was taken from.
export function sourceHref(source) {
  if (!source?.bookSlug) return '/library'
  return source.slug ? `/library/${source.bookSlug}/${source.slug}` : `/library/${source.bookSlug}`
}

export function sourceLabel(source) {
  if (!source) return ''
  return [source.book, source.roman ? `Cap. ${source.roman}` : ''].filter(Boolean).join(' · ')
}

/**
 * The lexicon key for a wordlist headword.
 *
 * Vocabulary rows carry display punctuation the lexicon does not: enclitics
 * begin with a hyphen ("-ne"), interjections end with a mark ("age!"), and a
 * compound interrogative may print several forms ("quis? quae? quid?"). The
 * lexicon files those as "ne", "age", and "quis".
 *
 * Ellipsis phrases ("nōn sōlum ... sed etiam") are real lexicon entries, so
 * only a question or exclamation mark cuts the head short. An ellipsis, a
 * colon, or a space inside the phrase is kept.
 */
export function dictionaryKey(headword) {
  let key = String(headword || '').replace(/^-+/, '')

  const stop = key.search(/[?!]/)
  if (stop !== -1) key = key.slice(0, stop)

  return key
    .replace(/[?!.,;:’‘'"…]+$/u, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Candidate keys, in order, for resolving a messy wordlist headword. */
export function dictionaryKeys(headword) {
  const key = dictionaryKey(headword)
  if (!key) return []
  const first = key.split(/\s+/)[0]
  return [...new Set(first === key ? [key] : [key, first])]
}

export function wordHref(headword) {
  // Enclitics are printed with a hyphen in the wordlist ("-ne"), but the
  // lexicon files them under the bare word ("ne").
  return `/dictionary/${encodeURIComponent(dictionaryKey(headword))}`
}

export function paradigmHref(headword) {
  return `${wordHref(headword)}/paradigm`
}

// Split an example around its {{highlighted}} forms, returning plain objects
// so this stays a framework-free module.
export function exampleSegments(text) {
  const out = []
  const re = /\{\{([^}]*)\}\}/g
  let last = 0
  let match
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) out.push({ t: text.slice(last, match.index), mark: false })
    out.push({ t: match[1], mark: true })
    last = re.lastIndex
  }
  if (last < text.length) out.push({ t: text.slice(last), mark: false })
  return out
}
