#!/usr/bin/env node
/**
 * Structural checks for the three Vergil data modules built from the Latin
 * Library: Aeneis, Eclogae, Georgica.
 *
 * The modules are large and generated from an external source, so these checks
 * guard the things a regeneration could silently break:
 *   - the expected number of chapters and readings
 *   - unique chapter and reading slugs
 *   - every reading has non-empty verse paragraphs
 *   - chapter verseCount matches the actual non-empty lines
 *   - the text really contains editorial macra
 *   - the shelf metadata required for a Latīnistae reader is present
 *
 * Run with: node scripts/validate-vergil-works.mjs
 */
import { book as aeneis, chapters as aeneisChapters } from '../src/data/vergil-aeneis/index.js'
import { book as eclogae, chapters as eclogaeChapters } from '../src/data/vergil-eclogae/index.js'
import { book as georgica, chapters as georgicaChapters } from '../src/data/vergil-georgica/index.js'

const MACRA = /[āēīōūȳĀĒĪŌŪȲ]/
const problems = []

const EXPECTED = [
  {
    book: aeneis,
    chapters: aeneisChapters,
    slug: 'vergil-aeneis',
    chapterTotal: 12,
    readingTotal: 108,
    verseTotal: 9890,
    sourceUnit: 'Aen.',
    unit: 'Liber',
    unitPlural: 'Libri',
    readingUnit: 'liber',
    readingUnitPlural: 'libri',
    collectionLabel: 'Libri',
    readingLabel: 'Liber',
    readingSlugPrefix: 'liber-',
  },
  {
    book: eclogae,
    chapters: eclogaeChapters,
    slug: 'vergil-eclogae',
    chapterTotal: 10,
    readingTotal: 10,
    verseTotal: 830,
    sourceUnit: 'Ecl.',
    unit: 'Ecloga',
    unitPlural: 'Eclogae',
    readingUnit: 'ecloga',
    readingUnitPlural: 'eclogae',
    collectionLabel: 'Eclogae',
    readingLabel: 'Ecloga',
    readingSlugPrefix: 'ecloga-',
  },
  {
    book: georgica,
    chapters: georgicaChapters,
    slug: 'vergil-georgica',
    chapterTotal: 4,
    readingTotal: 24,
    verseTotal: 2188,
    sourceUnit: 'Georg.',
    unit: 'Liber',
    unitPlural: 'Libri',
    readingUnit: 'liber',
    readingUnitPlural: 'libri',
    collectionLabel: 'Libri',
    readingLabel: 'Liber',
    readingSlugPrefix: 'liber-',
  },
]

function checkParagraph(where, text) {
  if (typeof text !== 'string') {
    problems.push(`${where}: paragraph is not a string`)
    return
  }
  if (!text.trim()) problems.push(`${where}: empty paragraph`)
  if (/\n|\r/.test(text)) problems.push(`${where}: paragraph contains a line break`)
  if (/\t/.test(text)) problems.push(`${where}: paragraph contains a tab`)
  if (/\s{2,}/.test(text)) problems.push(`${where}: paragraph contains a run of spaces`)
  if (/\uFFFD/.test(text)) problems.push(`${where}: paragraph contains a replacement character`)
  if ((text.match(/\{i\}/g) || []).length !== (text.match(/\{\/i\}/g) || []).length) {
    problems.push(`${where}: unbalanced italic markup`)
  }
}

const globalSlugs = new Set()

for (const spec of EXPECTED) {
  const { book, chapters } = spec
  const label = spec.slug
  const chapterSlugs = new Set()
  const readingIds = new Set()
  let readingCount = 0
  let verseCount = 0
  let markedReadings = 0

  if (book.slug !== spec.slug || book.id !== spec.slug) {
    problems.push(`${label}: book id/slug is ${book.id}/${book.slug}`)
  }
  if (book.kind !== 'reader') problems.push(`${label}: kind is not reader`)
  if (book.status !== 'active') problems.push(`${label}: status is not active`)
  if (book.language !== 'Latin') problems.push(`${label}: language is not Latin`)
  if (book.edition !== 'Digital edition after the Latin Library') {
    problems.push(`${label}: edition is ${book.edition}`)
  }
  if (book.year !== 2026) problems.push(`${label}: year is ${book.year}`)
  if (book.publisher !== 'The Latin Library') problems.push(`${label}: publisher is ${book.publisher}`)
  if (book.isbn !== '') problems.push(`${label}: isbn should be empty, found ${book.isbn}`)
  if (!book.level.startsWith('Reader — ')) problems.push(`${label}: level does not start with “Reader — ”`)
  if (book.sourceUnit !== spec.sourceUnit) problems.push(`${label}: sourceUnit is ${book.sourceUnit}`)
  for (const field of ['unit', 'unitPlural', 'readingUnit', 'readingUnitPlural', 'collectionLabel', 'readingLabel']) {
    const expected = spec[field]
    if (book[field] !== expected) problems.push(`${label}: ${field} is ${book[field]}, expected ${expected}`)
  }
  if (!book.description.includes('Alatius')) problems.push(`${label}: description does not name the macronizer`)
  if (!book.description.includes('Diacritics')) problems.push(`${label}: description does not mention the Diacritics menu`)

  if (chapters.length !== spec.chapterTotal) {
    problems.push(`${label}: expected ${spec.chapterTotal} chapters, found ${chapters.length}`)
  }
  if (book.chapterCount !== chapters.length) {
    problems.push(`${label}: book.chapterCount is ${book.chapterCount}`)
  }

  chapters.forEach((chapter, index) => {
    if (chapter.number !== index + 1) {
      problems.push(`${label}: expected chapter number ${index + 1}, found ${chapter.number}`)
    }
    if (!chapter.complete || chapter.status !== 'complete') {
      problems.push(`${label}/${chapter.slug}: chapter is not complete`)
    }
    if (globalSlugs.has(`${label}/${chapter.slug}`)) {
      problems.push(`${label}/${chapter.slug}: duplicate chapter slug`)
    }
    globalSlugs.add(`${label}/${chapter.slug}`)
    chapterSlugs.add(chapter.slug)
    if (!chapter.slug.startsWith(spec.readingSlugPrefix)) {
      problems.push(`${label}/${chapter.slug}: unexpected chapter slug`)
    }
    if (!chapter.readings?.length) {
      problems.push(`${label}/${chapter.slug}: no readings`)
      return
    }

    const expectedReadings = chapter.slug.startsWith('ecloga-') ? 1 : Math.ceil(chapter.verseCount / 100)
    if (chapter.readings.length !== expectedReadings) {
      problems.push(
        `${label}/${chapter.slug}: expected ${expectedReadings} readings, found ${chapter.readings.length}`,
      )
    }

    let lines = 0
    let previousEnd = 0
    for (const reading of chapter.readings) {
      readingCount += 1
      if (!reading.id) problems.push(`${label}/${chapter.slug}: reading without id`)
      if (readingIds.has(reading.id)) problems.push(`${label}/${reading.id}: duplicate reading id`)
      readingIds.add(reading.id)
      if (!reading.paragraphs?.length) {
        problems.push(`${label}/${chapter.slug}/${reading.id}: no paragraphs`)
        continue
      }
      let marked = false
      for (const [i, paragraph] of reading.paragraphs.entries()) {
        checkParagraph(`${label}/${chapter.slug}/${reading.id}/v${i + 1}`, paragraph)
        if (paragraph.trim()) lines += 1
        if (MACRA.test(paragraph)) marked = true
      }
      if (!reading.paragraphs.some((paragraph) => paragraph.trim())) {
        problems.push(`${label}/${chapter.slug}/${reading.id}: every paragraph is blank`)
      }
      if (marked) markedReadings += 1

      // For the hundred-line divisions, check that the ranges are contiguous.
      if (!chapter.slug.startsWith('ecloga-') && reading.latinTitle) {
        const match = reading.latinTitle.match(/Versūs (\d+)–(\d+)/)
        if (!match) {
          problems.push(`${label}/${chapter.slug}/${reading.id}: unreadable verse range`)
        } else {
          const start = Number(match[1])
          const end = Number(match[2])
          if (start !== previousEnd + 1) {
            problems.push(`${label}/${chapter.slug}/${reading.id}: range starts at ${start}, expected ${previousEnd + 1}`)
          }
          if (end - start + 1 !== reading.paragraphs.length) {
            problems.push(
              `${label}/${chapter.slug}/${reading.id}: range ${start}–${end} covers ${reading.paragraphs.length} lines`,
            )
          }
          previousEnd = end
        }
      }
    }

    if (chapter.verseCount !== lines) {
      problems.push(
        `${label}/${chapter.slug}: verseCount is ${chapter.verseCount}, but the readings contain ${lines} non-empty lines`,
      )
    }
    verseCount += lines
  })

  if (readingCount !== spec.readingTotal) {
    problems.push(`${label}: expected ${spec.readingTotal} readings, found ${readingCount}`)
  }
  if (verseCount !== spec.verseTotal) {
    problems.push(`${label}: expected ${spec.verseTotal} verse lines, found ${verseCount}`)
  }
  if (book.readingCount !== readingCount) {
    problems.push(`${label}: book.readingCount is ${book.readingCount}, expected ${readingCount}`)
  }
  if (book.readyCount !== chapters.filter((chapter) => chapter.complete).length) {
    problems.push(`${label}: book.readyCount is wrong`)
  }
  if (markedReadings === 0) problems.push(`${label}: no reading contains macra`)
  if (markedReadings !== readingCount) {
    problems.push(`${label}: ${readingCount - markedReadings} readings contain no macra`)
  }

  const text = (book.extras || [])
    .flatMap((extra) => extra.sections || [])
    .flatMap((section) => section.blocks || [])
    .map((block) => block.text || '')
    .join(' ')
  if (!text.includes('thelatinlibrary.com')) problems.push(`${label}: extras do not give the source URL`)
  if (!text.includes('Alatius')) problems.push(`${label}: extras do not name the macronizer`)
  if (!text.includes('Diacritics')) problems.push(`${label}: extras do not mention the Diacritics menu`)

  console.log(
    `${label}: ${chapters.length} chapters, ${readingCount} readings, ${verseCount} verse lines, ` +
      `${markedReadings} readings with macra`,
  )
}

console.log('Vergil works validation')
console.log('=======================')

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`)
  for (const problem of problems.slice(0, 100)) console.error(`  - ${problem}`)
  process.exit(1)
}

console.log('\nOK')
