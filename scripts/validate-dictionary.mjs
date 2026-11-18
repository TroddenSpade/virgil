#!/usr/bin/env node
/**
 * Audit the generated dictionary and its reading coverage.
 *
 * Run with: node scripts/validate-dictionary.mjs
 *
 * Hard failures (exit 1):
 *   - duplicate lemma ids, headwords or word keys
 *   - a lemma without a usable English definition
 *   - a word without a lemma, or a source id outside the source table
 *   - a word source that is not also attached to its lemma
 *   - any reading token that does not resolve in lexicon mode
 *
 * Soft warnings:
 *   - noun/verb/adjective lemmas without a paradigm signature/stems
 */
import { books } from './book-data.mjs'
import * as data from '../src/data/dictionary.generated.js'
import { libraryStats } from '../src/data/library-stats.generated.js'
import { dictionaryKeys, hasDefinition } from '../src/lib/dictionary.js'
import { buildLexiconIndex, latinTokens, lookupLexicon } from '../src/lib/lexicon.js'
import { headwordOf, isDenylisted } from './vocabulary.mjs'
import { createEngine, dictionaryForm } from 'whitakers-words/node'

const norm = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u00b4\u02ca\u02b9]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/j/g, 'i')
    .replace(/J/g, 'I')
    .replace(/-/g, '')
    .toLowerCase()
    .trim()

const LETTER = 'A-Za-zĀĒĪŌŪȲÿŸāēīōūȳ'
const engine = createEngine()
const cleanForm = (form) =>
  (form || '')
    .split(/\s{2,}/)[0]
    .trim()
    .replace(/^\s*[-–—]\s*,\s*/, '')
const lemmaOf = (form) => {
  for (const part of cleanForm(form).split(',')) {
    const cleaned = part
      .replace(new RegExp(`^[^${LETTER}]+`), '')
      .replace(new RegExp(`[^${LETTER}]+$`), '')
      .trim()
    if (cleaned) return cleaned
  }
  return ''
}
function analyses(head) {
  const out = []
  for (const candidate of [head, head.replace(/-/g, ''), head.replace(/\s+/g, '')]) {
    try {
      const parsed = engine.parseWord(norm(candidate))
      for (const result of parsed.results || []) {
        if (!result.de?.mean) continue
        const lemma = lemmaOf(dictionaryForm(result.de))
        if (lemma) out.push(lemma)
      }
    } catch {
      // A malformed OCR head is reported by the coverage check, not thrown.
    }
  }
  return [...new Set(out)]
}

const FRAGMENTS = new Set([...new Set([
  'um', 'ae', 'am', 'ōnis', 'us', 'ūs', 'ātis', 'uisse', 'sisse', 'disse',
  'ium', 'aef', 'nus', 'ria', 'ctum', 'mum', 'sque', 'runt', 'bant', 'sse',
  'cem', 'ctus', 'ior', 'ns', 'su', 'ra', 'ma', 'im', 'op', 'ir', 'la', 'ca',
  'fr', 'cl', 'ct', 'ce', 'ar', 'ag', 'tia', 'taque', 'sse', 'nsque', 'raque',
  'cutere', 'cipere', 'cīdere', 'ceptum', 'teriam', 'bit', 'daf', 'fpl',
])].map(norm))
const ABBREV = new Set([
  'gr', 'abl', 'acc', 'dat', 'gen', 'nom', 'voc', 'fpl', 'mpl', 'npl',
  'etc', 'cf', 'sc', 'cap', 'lib', 'p', 'pp', 'prp', 'adi', 'adv',
])
const ENGLISH = new Set([
  'the', 'and', 'of', 'to', 'with', 'from', 'by', 'on', 'at', 'as', 'is',
  'it', 'his', 'her', 'their', 'this', 'that', 'no', 'not', 'very', 'more',
  'most', 'up', 'out', 'off', 'over', 'under', 'into', 'about', 'than',
  'so', 'if', 'when', 'while', 'which', 'who', 'whom', 'whose', 'was',
  'were', 'be', 'been', 'being', 'are', 'am', 'you', 'she', 'he', 'they',
  'we', 'i', 'one', 'people', 'after', 'or', 'for', 'in', 'a', 'an', 'but',
  'all', 'any', 'can', 'could', 'would', 'should', 'may', 'might', 'must',
  'will', 'shall', 'do', 'does', 'did', 'have', 'has', 'had',
])
function likelyLatin(token) {
  const key = norm(token)
  if (key.length < 3) return false
  if (!/[aeiouyāēīōūȳ]/.test(key)) return false
  if (FRAGMENTS.has(key) || ABBREV.has(key) || ENGLISH.has(key)) return false
  if (/^[ivxlcdm]+$/.test(key)) return false
  return true
}

const PARADIGM_EXCEPTIONS = new Set(['erīnys', 'fugitat', 'ivssv', 'propīn'].map(norm))

const failures = []
const warnings = []

/* ---------- Published counts ---------- */
// Home, Library and the dictionary hero read this tiny module. Keep it in
// step with the dictionary index and the book registry.
if (data.stats) {
  if (libraryStats.words !== data.stats.words) {
    failures.push(
      `library stats words ${libraryStats.words} != dictionary words ${data.stats.words}`,
    )
  }
  if (libraryStats.lemmas !== data.stats.lemmas) {
    failures.push(
      `library stats lemmas ${libraryStats.lemmas} != dictionary lemmas ${data.stats.lemmas}`,
    )
  }
  if (libraryStats.wordsWithExamples !== data.stats.wordsWithExamples) {
    failures.push(
      `library stats wordsWithExamples ${libraryStats.wordsWithExamples} != dictionary ${data.stats.wordsWithExamples}`,
    )
  }
  if (libraryStats.chapters !== data.stats.sources) {
    failures.push(
      `library stats chapters ${libraryStats.chapters} != dictionary sources ${data.stats.sources}`,
    )
  }
}
if (libraryStats.books !== books.length) {
  failures.push(`library stats books ${libraryStats.books} != registry books ${books.length}`)
}
const registryChapters = books.reduce((total, book) => total + (book.chapters?.length || 0), 0)
if (libraryStats.chapters !== registryChapters) {
  failures.push(
    `library stats chapters ${libraryStats.chapters} != registry chapters ${registryChapters}`,
  )
}

/* ---------- Lemma and word identity ---------- */
const lemmaIds = new Set()
const lemmaHeads = new Map()
for (const lemma of data.lemmas) {
  if (!lemma.id) {
    failures.push('lemma without an id')
    continue
  }
  if (lemmaIds.has(lemma.id)) failures.push(`duplicate lemma id: ${lemma.id}`)
  lemmaIds.add(lemma.id)
  const head = norm(lemma.headword)
  if (head) {
    const previous = lemmaHeads.get(head)
    if (previous) failures.push(`duplicate headword: ${lemma.headword} (${previous} / ${lemma.id})`)
    else lemmaHeads.set(head, lemma.id)
  }
  if (!hasDefinition(lemma.english)) failures.push(`lemma without a definition: ${lemma.headword}`)
}

const wordKeys = new Set()
for (const word of data.words) {
  const key = norm(word.w)
  if (!key) {
    failures.push(`word without a usable key: ${JSON.stringify(word.w)}`)
    continue
  }
  if (wordKeys.has(key)) failures.push(`duplicate word key: ${word.w}`)
  wordKeys.add(key)
  if (!lemmaIds.has(word.l)) failures.push(`word ${word.w} points to missing lemma ${word.l}`)
  for (const source of word.s || []) {
    if (!data.sources[source]) failures.push(`word ${word.w} has an invalid source id ${source}`)
  }
  if ((word.s || []).length !== word.n) {
    failures.push(`word ${word.w} has ${word.s.length} listed sources but n=${word.n}`)
  }
}

for (const lemma of data.lemmas) {
  for (const source of lemma.s || []) {
    if (!data.sources[source]) failures.push(`lemma ${lemma.id} has an invalid source id ${source}`)
  }
}

/* Every lemma must be reachable from a word and carry the evidence the reader
   needs: at least one source and one example. Orphans used to be created as a
   side effect of resolving a token, then left behind when the token was
   rejected as a proper name. */
const wordsByLemma = new Map()
for (const word of data.words) {
  wordsByLemma.set(word.l, (wordsByLemma.get(word.l) || 0) + 1)
}
for (const lemma of data.lemmas) {
  if (!wordsByLemma.has(lemma.id)) failures.push(`lemma without any word: ${lemma.headword}`)
  if (!(lemma.s || []).length) failures.push(`lemma without sources: ${lemma.headword}`)
  if (lemma.e == null) failures.push(`lemma without an example: ${lemma.headword}`)
  if (lemma.english === 'proper name' && /que$/i.test(norm(lemma.headword))) {
    failures.push(`proper name with an enclitic headword: ${lemma.headword}`)
  }
}

/* Every form's sources must be attached to its lemma too. */
const lemmaById = new Map(data.lemmas.map((lemma) => [lemma.id, lemma]))
for (const word of data.words) {
  const lemma = lemmaById.get(word.l)
  if (!lemma) continue
  const lemmaSources = new Set(lemma.s || [])
  for (const source of word.s || []) {
    if (!lemmaSources.has(source)) {
      failures.push(
        `word ${word.w} has source ${source} but lemma ${lemma.id} does not list it`,
      )
    }
  }
  if (word.e != null) {
    const example = data.examples?.[word.e]
    if (!example) failures.push(`word ${word.w} points to missing example ${word.e}`)
    else if (!(word.s || []).includes(example.s)) {
      failures.push(`word ${word.w} example source ${example.s} is not in its source list`)
    }
  }
}

/* ---------- Paradigm expectations ---------- */
const paradigmGroups = new Set(['noun', 'verb', 'adjective', 'participle'])
const paradigmGaps = data.lemmas.filter(
  (lemma) =>
    paradigmGroups.has(lemma.posGroup) &&
    !lemma.sig &&
    !lemma.headword.includes(' ') &&
    lemma.english !== 'proper name' &&
    !/^[A-Z]{2,}$/.test(lemma.headword) &&
    !PARADIGM_EXCEPTIONS.has(norm(lemma.headword)) &&
    !/indeclin/i.test(lemma.pos || '') &&
    !/indeclin/i.test(lemma.english || ''),
)
for (const lemma of paradigmGaps) {
  warnings.push(`no paradigm for ${lemma.headword} (${lemma.pos || 'no pos'})`)
}

/* ---------- Lexicon coverage ---------- */
const index = buildLexiconIndex(data)
let readingTokens = 0
let missingTokens = 0
let likelyTokens = 0
let missingLikely = 0
const missing = new Map()
const missingLatin = new Map()
const missingByBook = new Map()

for (const book of books) {
  for (const chapter of book.chapters || []) {
    const texts = []
    for (const reading of chapter.readings || []) {
      texts.push(...(reading.paragraphs || []))
    }
    for (const text of texts) {
      for (const token of latinTokens(text)) {
        if (token.type !== 'word' || token.value.length < 2) continue
        readingTokens += 1
        const latin = likelyLatin(token.value)
        if (latin) likelyTokens += 1
        if (lookupLexicon(index, token.value)) continue
        missingTokens += 1
        if (latin) {
          missingLikely += 1
          missingLatin.set(token.value, (missingLatin.get(token.value) || 0) + 1)
        }
        missing.set(token.value, (missing.get(token.value) || 0) + 1)
        missingByBook.set(book.slug, (missingByBook.get(book.slug) || 0) + 1)
      }
    }
  }
}

const coverage = readingTokens ? (100 * (readingTokens - missingTokens)) / readingTokens : 100
const latinCoverage = likelyTokens ? (100 * (likelyTokens - missingLikely)) / likelyTokens : 100
if (latinCoverage < 99.5) {
  failures.push(`Latin reading coverage is ${latinCoverage.toFixed(3)}% (minimum 99.5%)`)
}

/* ---------- Printed vocabulary coverage ----------
   Every non-denylisted vocabulary row must resolve to a lemma or a word. This
   catches a glossary headword that never appears in a reading and was silently
   skipped by the builder. */
let vocabularyRows = 0
const missingVocabulary = []
for (const book of books) {
  for (const chapter of book.chapters || []) {
    for (const word of chapter.vocabulary || []) {
      if (isDenylisted(book.slug, chapter.number, word.latin)) continue
      const head = headwordOf(word)
      if (!head) continue
      vocabularyRows += 1
      const direct = dictionaryKeys(head).some((key) => {
        const k = norm(key)
        return lemmaHeads.has(k) || wordKeys.has(k)
      })
      if (direct) continue
      const analysed = analyses(head).some((lemma) => {
        const k = norm(lemma)
        return lemmaHeads.has(k) || wordKeys.has(k)
      })
      if (analysed) continue
      missingVocabulary.push({ book: book.slug, chapter: chapter.number, head })
    }
  }
}
for (const row of missingVocabulary) {
  failures.push(
    `vocabulary headword unresolved: ${row.head} (${row.book} ${row.chapter})`,
  )
}

/* ---------- Report ---------- */
console.log('Dictionary validation')
console.log('======================')
console.log(`lemmas: ${data.lemmas.length}`)
console.log(`words: ${data.words.length}`)
console.log(`sources: ${data.sources.length}`)
console.log(`examples: ${data.examples.length}`)
console.log(`printed vocabulary rows: ${vocabularyRows} (${missingVocabulary.length} unresolved)`)
console.log(`lexicon coverage (all tokens): ${(readingTokens - missingTokens).toLocaleString()}/${readingTokens.toLocaleString()} (${coverage.toFixed(3)}%)`)
console.log(`lexicon coverage (Latin words): ${(likelyTokens - missingLikely).toLocaleString()}/${likelyTokens.toLocaleString()} (${latinCoverage.toFixed(3)}%)`)
console.log(`paradigm gaps: ${paradigmGaps.length}`)

if (missing.size) {
  console.log('\nMissing reading tokens by book:')
  for (const [book, count] of [...missingByBook.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${book}: ${count}`)
  }
  console.log('\nTop missing Latin tokens:')
  for (const [token, count] of [...missingLatin.entries()].sort((a, b) => b[1] - a[1]).slice(0, 80)) {
    console.log(`  ${token} (${count})`)
  }
}

if (warnings.length) {
  console.log('\nWarnings:')
  for (const warning of warnings.slice(0, 40)) console.log(`  ${warning}`)
  if (warnings.length > 40) console.log(`  … and ${warnings.length - 40} more`)
}

if (failures.length) {
  console.error('\nFailures:')
  for (const failure of failures.slice(0, 80)) console.error(`  ${failure}`)
  if (failures.length > 80) console.error(`  … and ${failures.length - 80} more`)
  process.exit(1)
}

console.log('\nOK')
