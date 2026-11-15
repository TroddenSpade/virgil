// The full study document that travels with an account copy.
//
// Learned chapters, hand-saved and known words, and spaced-repetition history
// are one local-first document. The old account format held only progress at
// the top level, so normalizeStudy accepts both shapes and the saver keeps a
// top-level `books` copy for older clients.

import {
  applyLocalProgress,
  normalizeProgress,
  readLocalProgress,
} from './progress.js'
import {
  normalizeSavedWords,
  readSavedWords,
  writeSavedWords,
} from './saved-words.js'
import {
  normalizeReview,
  readReview,
  writeReview,
} from './review.js'

export const STUDY_VERSION = 1

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function normalizeStudy(value) {
  const source = isObject(value) ? value : {}
  const progressSource = isObject(source.progress) ? source.progress : source
  return {
    version: STUDY_VERSION,
    progress: normalizeProgress(progressSource),
    savedWords: normalizeSavedWords(source.savedWords || source.wordlist),
    review: normalizeReview(source.review),
  }
}

export function readLocalStudy() {
  return {
    version: STUDY_VERSION,
    progress: readLocalProgress(),
    savedWords: readSavedWords(),
    review: readReview(),
  }
}

function hasSavedWords(value) {
  return isObject(value?.savedWords) || isObject(value?.wordlist)
}

function hasReview(value) {
  return isObject(value?.review)
}

/**
 * Write an account copy onto this device. A legacy copy without saved words or
 * review history leaves the local versions in place instead of erasing them.
 */
export function applyLocalStudy(value) {
  const source = isObject(value) ? value : {}
  const study = normalizeStudy(source)
  const current = readLocalStudy()

  const savedWords = hasSavedWords(source) ? study.savedWords : current.savedWords
  const review = hasReview(source) ? study.review : current.review

  const progress = applyLocalProgress(study.progress)
  if (!progress.ok) return progress

  writeSavedWords(savedWords)
  writeReview(review)

  return {
    ok: true,
    study: {
      version: STUDY_VERSION,
      progress: progress.progress,
      savedWords,
      review,
    },
  }
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function canonicalSavedWords(savedWords) {
  const saved = {}
  const source = savedWords?.saved && isObject(savedWords.saved) ? savedWords.saved : {}
  for (const key of Object.keys(source).sort()) {
    const entry = source[key] || {}
    saved[key] = {
      headword: entry.headword || '',
      principal: entry.principal || '',
      english: entry.english || '',
      posGroup: entry.posGroup || '',
      form: entry.form || '',
      source: entry.source || null,
    }
  }
  const known = Object.keys(savedWords?.known || {}).sort()
  return { saved, known }
}

/**
 * Compare two study documents without volatile timestamps. “Added at” and
 * “known at” are local bookkeeping, not content.
 */
export function studyFingerprint(value) {
  const study = normalizeStudy(value)
  return stableStringify({
    version: study.version,
    books: study.progress.books,
    savedWords: canonicalSavedWords(study.savedWords),
    review: {
      version: study.review.version,
      words: study.review.words,
      days: study.review.days,
      settings: study.review.settings,
    },
  })
}

/** The shape written to Supabase. `books` stays top-level for older clients. */
export function studyDocument(value) {
  const study = normalizeStudy(value)
  return {
    version: study.version,
    books: study.progress.books,
    progress: study.progress,
    savedWords: study.savedWords,
    review: study.review,
  }
}
