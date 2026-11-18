// Reviewed corrections to the editorial macra.
//
// The macronized book texts are generated data: the Alatius Latin Macronizer
// supplies quantities where the source prints none. A review occasionally
// finds a wrong quantity, and the correction belongs in the small override
// file rather than in the generated text. This module is the single reader of
// that file, shared by the Vite build, the dictionary builder and the review
// script.
import { readFileSync } from 'node:fs'

const MANIFEST_URL = new URL('../src/data/macra-overrides.json', import.meta.url)

const manifest = JSON.parse(readFileSync(MANIFEST_URL, 'utf8'))

export const MACRA_OVERRIDES = manifest

/** Every reviewed correction, in file order. */
export function allCorrections() {
  return Array.isArray(manifest.corrections) ? manifest.corrections : []
}

/** Reviewed corrections for one book (the data folder / book slug). */
export function correctionsForBook(book) {
  return allCorrections().filter((correction) => correction.book === book)
}

/** The review date of a correction, or null when it is still undated. */
export function reviewedOn(correction) {
  return correction?.reviewed || null
}

/** The book folders that have at least one correction. */
export function overrideBooks() {
  return new Set(allCorrections().map((correction) => correction.book).filter(Boolean))
}

/**
 * Apply the reviewed corrections for one book to one string of text.
 *
 * The replacement is deliberately literal: the entries are short phrases
 * checked against the surrounding Latin, so a global word replacement would
 * be unsafe (Galliā is a correct ablative elsewhere in Caesar).
 */
export function applyMacraOverrides(book, text) {
  const value = String(text ?? '')
  if (!value) return value
  let result = value
  for (const correction of correctionsForBook(book)) {
    if (!correction.from || typeof correction.to !== 'string') continue
    result = result.split(correction.from).join(correction.to)
  }
  return result
}

/** Dictionary headword/word corrections, applied by the dictionary builder. */
export function dictionaryOverrides() {
  return manifest.dictionary || {}
}
