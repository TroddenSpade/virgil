#!/usr/bin/env node
/**
 * Per-book structural and lexical checks.
 *
 * This is the book-level counterpart to validate-dictionary.mjs. It makes a
 * weak book visible even when the global dictionary coverage looks healthy.
 *
 * Run with: node scripts/validate-books.mjs
 *
 * Hard failures:
 *   - a book with no chapters
 *   - duplicate chapter numbers, slugs or roman labels
 *   - duplicate reading ids inside a book
 *   - a complete reading book with an empty chapter or an empty reading
 *   - a commentary/section book with an empty section
 *   - missing book/chapter/reading headings where a heading is required
 *   - per-book Latin coverage below its floor (99.5% by default)
 *
 * Warnings:
 *   - coverage below 99.5% for a book with an explicit OCR exception
 *   - suspicious OCR fragments or impossible consonant runs
 *
 * A machine-readable report with every unresolved token, grouped by book, is
 * written to reports/book-validation.json (override with BOOK_REPORT).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { books } from './book-data.mjs'
import * as data from '../src/data/dictionary.generated.js'
import { buildLexiconIndex, latinTokens, lookupLexicon } from '../src/lib/lexicon.js'

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

const FRAGMENTS = new Set([
  'um', 'ae', 'am', 'ōnis', 'us', 'ūs', 'ātis', 'uisse', 'sisse', 'disse',
  'ium', 'aef', 'nus', 'ria', 'ctum', 'mum', 'sque', 'runt', 'bant', 'sse',
  'cem', 'ctus', 'ior', 'ns', 'su', 'ra', 'ma', 'im', 'op', 'ir', 'la', 'ca',
  'fr', 'cl', 'ct', 'ce', 'ar', 'ag', 'tia', 'taque', 'nsque', 'raque',
  'cutere', 'cipere', 'cīdere', 'ceptum', 'teriam', 'bit', 'daf', 'fpl',
].map(norm))

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

const TARGET_COVERAGE = 99.5
// Two older OCR-derived school editions cannot meet the 99.5% floor without
// a fresh transcription. They still fail hard below their documented floor.
const COVERAGE_FLOORS = new Map([
  ['ovidii-ars-amatoria', { floor: 98.0, note: 'OCR-derived school edition' }],
  ['epitome-historiae-sacrae', { floor: 99.0, note: 'OCR-derived school edition' }],
])

const failures = []
const warnings = []
const index = buildLexiconIndex(data)

function pushFailure(book, message) {
  failures.push(`${book.slug}: ${message}`)
}

function pushWarning(book, message) {
  warnings.push(`${book.slug}: ${message}`)
}

function checkHeadings(book, chapter) {
  if (!chapter.title && !chapter.latinTitle) {
    pushFailure(book, `chapter ${chapter.number} has no title or latinTitle`)
  }
  if (!chapter.slug) pushFailure(book, `chapter ${chapter.number} has no slug`)
  if (!chapter.number && chapter.number !== 0) {
    pushFailure(book, `chapter ${JSON.stringify(chapter.slug)} has no number`)
  }
}

function checkReadings(book, chapter) {
  if (!chapter.readings?.length) {
    if (chapter.complete !== false) {
      pushFailure(book, `chapter ${chapter.roman || chapter.slug} has no readings`)
    }
    return
  }

  const ids = new Set()
  for (const reading of chapter.readings) {
    if (!reading.id) pushFailure(book, `chapter ${chapter.roman || chapter.slug}: reading without id`)
    else if (ids.has(reading.id)) {
      pushFailure(book, `chapter ${chapter.roman || chapter.slug}: duplicate reading id ${reading.id}`)
    }
    ids.add(reading.id)

    if (!reading.paragraphs?.some((paragraph) => String(paragraph).trim())) {
      pushFailure(book, `chapter ${chapter.roman || chapter.slug}/${reading.id || '?'}: empty reading`)
    }

    if (
      !reading.hideHead &&
      !reading.title &&
      !reading.latinTitle
    ) {
      pushWarning(
        book,
        `chapter ${chapter.roman || chapter.slug}/${reading.id || '?'}: reading has no heading`,
      )
    }
  }
}

function checkSections(book, chapter) {
  if (!chapter.sections?.length) {
    if (chapter.complete !== false) {
      pushFailure(book, `chapter ${chapter.roman || chapter.slug} has no sections`)
    }
    return
  }

  const ids = new Set()
  for (const section of chapter.sections) {
    if (!section.id) pushFailure(book, `chapter ${chapter.roman || chapter.slug}: section without id`)
    else if (ids.has(section.id)) {
      pushFailure(book, `chapter ${chapter.roman || chapter.slug}: duplicate section id ${section.id}`)
    }
    ids.add(section.id)

    if (!section.latin && !section.english) {
      pushWarning(book, `chapter ${chapter.roman || chapter.slug}/${section.id || '?'}: section has no heading`)
    }
    if (!section.blocks?.length) {
      pushFailure(book, `chapter ${chapter.roman || chapter.slug}/${section.id || '?'}: empty section`)
    }
  }
}

function checkPensa(book, chapter) {
  if (!chapter.pensa?.length) {
    if (chapter.complete !== false) {
      pushFailure(book, `chapter ${chapter.roman || chapter.slug} has no exercises`)
    }
    return
  }

  const ids = new Set()
  for (const pensum of chapter.pensa) {
    if (!pensum.id) pushFailure(book, `chapter ${chapter.roman || chapter.slug}: exercise without id`)
    else if (ids.has(pensum.id)) {
      pushFailure(book, `chapter ${chapter.roman || chapter.slug}: duplicate exercise id ${pensum.id}`)
    }
    ids.add(pensum.id)

    if (!pensum.latinLabel && !pensum.title) {
      pushWarning(book, `chapter ${chapter.roman || chapter.slug}/${pensum.id || '?'}: exercise has no heading`)
    }
    if (!pensum.items?.length) {
      pushFailure(book, `chapter ${chapter.roman || chapter.slug}/${pensum.id || '?'}: empty exercise`)
    }
  }
}

function readingTokensFor(book) {
  const out = []
  for (const chapter of book.chapters || []) {
    for (const reading of chapter.readings || []) {
      for (const paragraph of reading.paragraphs || []) {
        for (const token of latinTokens(paragraph)) {
          if (token.type === 'word') out.push(token.value)
        }
      }
    }
  }
  return out
}

function suspiciousToken(token) {
  const key = norm(token)
  if (FRAGMENTS.has(key)) return true
  if (/^[bcdfghjklmnpqrstvwxz]{5,}$/i.test(key)) return true
  if (/[0-9]/.test(token)) return true
  return false
}

const rows = []

for (const book of books) {
  const chapters = book.chapters || []
  if (!chapters.length) {
    pushFailure(book, 'book has no chapters')
    continue
  }

  if (!book.title) pushFailure(book, 'book has no title')
  if (!book.latinTitle) pushWarning(book, 'book has no latinTitle')

  const bookUsesReadings = chapters.some((chapter) => chapter.readings?.length)
  const bookUsesSections = chapters.some((chapter) => chapter.sections?.length)

  const chapterNumbers = new Set()
  const chapterSlugs = new Set()
  const chapterRomans = new Set()
  for (const chapter of chapters) {
    if (chapterNumbers.has(chapter.number)) {
      pushFailure(book, `duplicate chapter number ${chapter.number}`)
    }
    chapterNumbers.add(chapter.number)

    if (chapter.slug) {
      if (chapterSlugs.has(chapter.slug)) pushFailure(book, `duplicate chapter slug ${chapter.slug}`)
      chapterSlugs.add(chapter.slug)
    }

    if (chapter.roman) {
      if (chapterRomans.has(chapter.roman)) pushFailure(book, `duplicate chapter roman ${chapter.roman}`)
      chapterRomans.add(chapter.roman)
    }

    checkHeadings(book, chapter)

    const usesSections =
      Boolean(chapter.sections?.length) ||
      (bookUsesSections && !chapter.readings?.length)
    if (chapter.readings?.length || bookUsesReadings) checkReadings(book, chapter)
    else if (usesSections) checkSections(book, chapter)
    else checkPensa(book, chapter)
  }

  const tokens = readingTokensFor(book)
  const tokenCount = tokens.length
  let likelyCount = 0
  let missingCount = 0
  const missing = new Map()
  const suspicious = new Map()

  for (const token of tokens) {
    if (suspiciousToken(token)) {
      suspicious.set(token, (suspicious.get(token) || 0) + 1)
    }
    if (!likelyLatin(token)) continue
    likelyCount += 1
    if (lookupLexicon(index, token)) continue
    missingCount += 1
    missing.set(token, (missing.get(token) || 0) + 1)
  }

  const coverage = likelyCount ? (100 * (likelyCount - missingCount)) / likelyCount : 100
  const exception = COVERAGE_FLOORS.get(book.slug)
  const floor = exception?.floor ?? TARGET_COVERAGE

  if (likelyCount > 0) {
    if (coverage < floor) {
      pushFailure(
        book,
        `Latin coverage ${coverage.toFixed(3)}% is below the ${floor}% floor` +
          (exception ? ` (${exception.note})` : ''),
      )
    } else if (coverage < TARGET_COVERAGE) {
      pushWarning(
        book,
        `Latin coverage ${coverage.toFixed(3)}% is below the ${TARGET_COVERAGE}% target` +
          (exception ? ` (${exception.note})` : ''),
      )
    }
  }

  if (suspicious.size) {
    pushWarning(
      book,
      `${suspicious.size} suspicious OCR token${suspicious.size === 1 ? '' : 's'}: ` +
        [...suspicious.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([token, count]) => `${token} (${count})`)
          .join(', '),
    )
  }

  rows.push({
    slug: book.slug,
    chapters: chapters.length,
    readings: chapters.reduce((total, chapter) => total + (chapter.readings?.length || 0), 0),
    tokens: tokenCount,
    likely: likelyCount,
    missing: missingCount,
    coverage,
    floor,
    exception: exception?.note || '',
    topMissing: [...missing.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    missingTokens: [...missing.entries()].sort((a, b) => b[1] - a[1]),
    suspicious: suspicious.size,
    suspiciousTokens: [...suspicious.entries()].sort((a, b) => b[1] - a[1]),
  })
}

console.log('Book validation')
console.log('===============')
console.log(`books: ${rows.length}`)
console.log(`chapters: ${rows.reduce((total, row) => total + row.chapters, 0)}`)
console.log(`readings: ${rows.reduce((total, row) => total + row.readings, 0)}`)
console.log(`Latin tokens: ${rows.reduce((total, row) => total + row.likely, 0).toLocaleString()}`)
console.log(`Latin coverage (global): ${
  (() => {
    const likely = rows.reduce((total, row) => total + row.likely, 0)
    const missing = rows.reduce((total, row) => total + row.missing, 0)
    return likely ? ((100 * (likely - missing)) / likely).toFixed(3) : '100.000'
  })()
}%`)

const sorted = [...rows].sort((a, b) => a.coverage - b.coverage)
for (const row of sorted) {
  const flag = row.coverage < row.floor ? 'FAIL' : row.coverage < TARGET_COVERAGE ? 'WARN' : 'ok'
  console.log(
    `${flag.padEnd(4)} ${row.slug.padEnd(38)} ${row.coverage.toFixed(3).padStart(8)}% ` +
      `(${row.missing}/${row.likely} missing)`,
  )
  if (row.topMissing.length) {
    console.log(
      `     missing: ${row.topMissing.map(([token, count]) => `${token} (${count})`).join(', ')}`,
    )
  }
  if (row.exception) console.log(`     floor: ${row.floor}% — ${row.exception}`)
}

if (warnings.length) {
  console.log('\nWarnings:')
  for (const warning of warnings) console.log(`  ${warning}`)
}

const reportPath = process.env.BOOK_REPORT || 'reports/book-validation.json'
const globalLikely = rows.reduce((total, row) => total + row.likely, 0)
const globalMissing = rows.reduce((total, row) => total + row.missing, 0)
const report = {
  generatedAt: new Date().toISOString(),
  targetCoverage: TARGET_COVERAGE,
  global: {
    books: rows.length,
    chapters: rows.reduce((total, row) => total + row.chapters, 0),
    readings: rows.reduce((total, row) => total + row.readings, 0),
    tokens: rows.reduce((total, row) => total + row.tokens, 0),
    likelyTokens: globalLikely,
    missingTokens: globalMissing,
    coverage: globalLikely ? (100 * (globalLikely - globalMissing)) / globalLikely : 100,
  },
  warnings,
  failures,
  books: sorted.map((row) => ({
    slug: row.slug,
    chapters: row.chapters,
    readings: row.readings,
    tokens: row.tokens,
    likelyTokens: row.likely,
    missing: row.missing,
    coverage: row.coverage,
    floor: row.floor,
    exception: row.exception,
    status: row.coverage < row.floor ? 'fail' : row.coverage < TARGET_COVERAGE ? 'warn' : 'ok',
    unresolved: row.missingTokens,
    suspicious: row.suspiciousTokens,
  })),
}

try {
  mkdirSync(dirname(reportPath), { recursive: true })
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`\nReport: ${reportPath}`)
} catch (error) {
  console.error(`\nCould not write report ${reportPath}: ${error.message}`)
  failures.push(`could not write report ${reportPath}: ${error.message}`)
}

if (failures.length) {
  console.error('\nFailures:')
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}

console.log('\nOK')
