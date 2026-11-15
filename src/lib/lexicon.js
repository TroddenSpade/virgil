// Reading-time lexicon helpers.
//
// The full dictionary is loaded only when Lexicon mode is first switched on.
// This module keeps the loader, the compact lookup index, and the small text
// parser used by the reading popover free of React concerns.

import { norm } from './dictionary.js'

// The same letter class the dictionary generator indexes, so a token in the
// reader and a form in the lexicon always agree about what a "word" is.
const WORD = /[A-Za-zĀĒĪŌŪȲāēīōūȳÆæŒœ]+/g
const MARKUP = /(\{i\}|\{\/i\}|\{b\}|\{\/b\}|\{\{\d+\}\})/

let cachedIndex = null
let pendingIndex = null

/** Split plain Latin text into words and the punctuation between them. */
export function latinTokens(text) {
  const value = String(text ?? '')
  const tokens = []
  let last = 0

  for (const match of value.matchAll(WORD)) {
    if (match.index > last) {
      tokens.push({ type: 'text', value: value.slice(last, match.index) })
    }
    tokens.push({ type: 'word', value: match[0] })
    last = match.index + match[0].length
  }

  if (last < value.length) {
    tokens.push({ type: 'text', value: value.slice(last) })
  }
  return tokens
}

/**
 * Read the book's inline markup into plain segments, carrying italic/bold
 * state so the lexical wrapping never sees `{i}` or `{{n}}` as words.
 */
export function parseReadingMarkup(text) {
  const value = String(text ?? '')
  const nodes = []
  let italic = 0
  let bold = 0

  for (const part of value.split(MARKUP)) {
    if (!part) continue
    if (part === '{i}') {
      italic += 1
      continue
    }
    if (part === '{/i}') {
      italic = Math.max(0, italic - 1)
      continue
    }
    if (part === '{b}') {
      bold += 1
      continue
    }
    if (part === '{/b}') {
      bold = Math.max(0, bold - 1)
      continue
    }

    const note = part.match(/^\{\{(\d+)\}\}$/)
    if (note) {
      nodes.push({ type: 'note', value: note[1] })
      continue
    }

    nodes.push({
      type: 'text',
      value: part,
      italic: italic > 0,
      bold: bold > 0,
    })
  }
  return nodes
}

/**
 * Build the form-to-lemma lookup used by the reading popovers.
 *
 * `data.words` already contains every inflected form in the readings. A
 * second map of headwords lets an unusual spelling fall back to its lemma.
 */
export function buildLexiconIndex(data) {
  const lemmaById = new Map()
  const lemmaByWord = new Map()
  for (const lemma of data?.lemmas || []) {
    if (!lemma?.id || !lemma.headword) continue
    lemmaById.set(lemma.id, lemma)
    lemmaByWord.set(norm(lemma.headword), lemma)
  }

  // Exact surface forms preserve macra and case, so Rōma and Rōmā keep
  // different parses even though they fold to the same dictionary key.
  const surface = new Map()
  for (const form of data?.surfaceForms || []) {
    const lemma = lemmaById.get(form?.l)
    if (!lemma || !form?.w) continue
    surface.set(form.w.toLowerCase(), { form: form.w, lemma, parse: form.g || '' })
  }

  // The folded index is the safety net for spellings the readings do not
  // contain (for example an OCR form without macra).
  const forms = new Map()
  for (const word of data?.words || []) {
    const lemma = lemmaById.get(word?.l)
    if (!lemma || !word?.w) continue
    const key = norm(word.w)
    if (!key) continue
    forms.set(key, { form: word.w, lemma })
  }

  return { surface, forms, lemmas: lemmaByWord }
}

/** Find the gloss for one token, preferring its exact inflected form. */
export function lookupLexicon(index, token) {
  if (!index) return null
  const exactKey = String(token || '').toLowerCase()
  const key = norm(token)
  if (!key) return null

  const exact = index.surface?.get(exactKey)
  if (exact) return { ...exact, fromLemma: false, exact: true }

  const form = index.forms.get(key)
  if (form) return { ...form, parse: '', fromLemma: false, exact: false }

  const lemma = index.lemmas.get(key)
  if (lemma) return { form: lemma.headword, lemma, parse: '', fromLemma: true, exact: false }

  return null
}

/** The already-loaded index, if the reader has opened Lexicon mode before. */
export function cachedLexicon() {
  return cachedIndex
}

/** Load and index the dictionary once per page session. */
export function loadLexicon() {
  if (cachedIndex) return Promise.resolve(cachedIndex)
  if (!pendingIndex) {
    pendingIndex = import('../data/dictionary.generated.js')
      .then((data) => {
        cachedIndex = buildLexiconIndex(data)
        return cachedIndex
      })
      .catch((error) => {
        pendingIndex = null
        throw error
      })
  }
  return pendingIndex
}
