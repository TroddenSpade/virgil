#!/usr/bin/env node
/**
 * Structural checks for the six Horace works added from the Latin Library.
 *
 * The texts are long and were produced by a parser plus editorial macronization,
 * so these checks guard what a regeneration could silently break:
 *   - the exact chapter and reading counts of each work
 *   - unique chapter slugs and reading ids
 *   - non-empty readings
 *   - the outline's verseCount matching the non-empty verse lines
 *   - at least one macronized reading in every book
 *   - the Latīnistae metadata required of an original edition
 *
 * Run with: node scripts/validate-horace-works.mjs
 */
import { book as sermones, chapters as sermonesChapters } from '../src/data/horatius-sermones/index.js'
import { book as carmina, chapters as carminaChapters } from '../src/data/horatius-carmina/index.js'
import { book as epistulae, chapters as epistulaeChapters } from '../src/data/horatius-epistulae/index.js'
import { book as arsPoetica, chapters as arsChapters } from '../src/data/horatius-ars-poetica/index.js'
import { book as carmenSaeculare, chapters as saecChapters } from '../src/data/horatius-carmen-saeculare/index.js'
import { book as epodi, chapters as epodiChapters } from '../src/data/horatius-epodi/index.js'

const MACRA = /[āēīōūȳĀĒĪŌŪȲ]/

const expected = [
  {
    book: sermones,
    chapters: sermonesChapters,
    chapterCount: 2,
    readingCount: 18,
    verseCount: 2121,
    sourceUnit: 'Serm.',
  },
  {
    book: carmina,
    chapters: carminaChapters,
    chapterCount: 4,
    readingCount: 103,
    verseCount: 3034,
    sourceUnit: 'Carm.',
  },
  {
    book: epistulae,
    chapters: epistulaeChapters,
    chapterCount: 2,
    readingCount: 22,
    verseCount: 1492,
    sourceUnit: 'Ep.',
  },
  {
    book: arsPoetica,
    chapters: arsChapters,
    chapterCount: 1,
    readingCount: 1,
    verseCount: 476,
    sourceUnit: 'Ars',
  },
  {
    book: carmenSaeculare,
    chapters: saecChapters,
    chapterCount: 1,
    readingCount: 1,
    verseCount: 76,
    sourceUnit: 'Carm. Saec.',
  },
  {
    book: epodi,
    chapters: epodiChapters,
    chapterCount: 1,
    readingCount: 17,
    verseCount: 625,
    sourceUnit: 'Epod.',
  },
]

const problems = []
const seenSlugs = new Set()
const seenReadingIds = new Set()

console.log('Horace works validation')
console.log('======================')

for (const item of expected) {
  const { book, chapters } = item
  const slug = book.slug

  if (book.id !== slug) problems.push(`${slug}: book.id does not match the slug`)
  if (book.kind !== 'reader') problems.push(`${slug}: kind is not reader`)
  if (book.status !== 'active') problems.push(`${slug}: status is not active`)
  if (book.language !== 'Latin') problems.push(`${slug}: language is not Latin`)
  if (book.edition !== 'Digital edition after the Latin Library') {
    problems.push(`${slug}: unexpected edition ${JSON.stringify(book.edition)}`)
  }
  if (book.year !== 2026) problems.push(`${slug}: year is not 2026`)
  if (book.publisher !== 'The Latin Library') problems.push(`${slug}: publisher is not The Latin Library`)
  if (book.isbn !== '') problems.push(`${slug}: isbn should be empty`)
  if (!book.level?.startsWith('Reader — ')) problems.push(`${slug}: level does not start with "Reader — "`)
  if (book.sourceUnit !== item.sourceUnit) {
    problems.push(`${slug}: sourceUnit is ${book.sourceUnit}, expected ${item.sourceUnit}`)
  }

  if (book.chapterCount !== item.chapterCount) {
    problems.push(`${slug}: chapterCount is ${book.chapterCount}, expected ${item.chapterCount}`)
  }
  if (chapters.length !== item.chapterCount) {
    problems.push(`${slug}: found ${chapters.length} chapters, expected ${item.chapterCount}`)
  }
  if (book.readingCount !== item.readingCount) {
    problems.push(`${slug}: readingCount is ${book.readingCount}, expected ${item.readingCount}`)
  }
  if (book.readyCount !== chapters.length) {
    problems.push(`${slug}: readyCount does not match the number of chapters`)
  }
  if (seenSlugs.has(slug)) problems.push(`${slug}: duplicate book slug`)
  seenSlugs.add(slug)

  let lines = 0
  let readings = 0
  let macronizedReadings = 0
  const chapterSlugs = new Set()

  for (const chapter of chapters) {
    if (!chapter.complete) problems.push(`${slug}/${chapter.slug}: chapter is not complete`)
    if (chapterSlugs.has(chapter.slug)) problems.push(`${slug}/${chapter.slug}: duplicate chapter slug`)
    chapterSlugs.add(chapter.slug)
    if (!chapter.readings?.length) problems.push(`${slug}/${chapter.slug}: no readings`)

    let chapterLines = 0
    for (const reading of chapter.readings || []) {
      readings += 1
      if (!reading.id) problems.push(`${slug}/${chapter.slug}: reading without an id`)
      if (seenReadingIds.has(reading.id)) problems.push(`${reading.id}: duplicate reading id`)
      seenReadingIds.add(reading.id)
      if (!reading.paragraphs?.length) {
        problems.push(`${slug}/${chapter.slug}/${reading.id}: no paragraphs`)
      }
      if (!reading.paragraphs?.some((paragraph) => paragraph.trim())) {
        problems.push(`${slug}/${chapter.slug}/${reading.id}: every paragraph is blank`)
      }
      if (reading.paragraphs?.some((paragraph) => !paragraph.trim())) {
        problems.push(`${slug}/${chapter.slug}/${reading.id}: contains a blank verse line`)
      }
      if (reading.paragraphs?.some((paragraph) => MACRA.test(paragraph))) macronizedReadings += 1
      chapterLines += (reading.paragraphs || []).filter((paragraph) => paragraph.trim()).length
    }

    if (chapter.verseCount !== chapterLines) {
      problems.push(
        `${slug}/${chapter.slug}: verseCount is ${chapter.verseCount}, but readings contain ` +
          `${chapterLines} non-empty lines`,
      )
    }
    lines += chapterLines
  }

  if (readings !== item.readingCount) {
    problems.push(`${slug}: found ${readings} readings, expected ${item.readingCount}`)
  }
  if (lines !== item.verseCount) {
    problems.push(`${slug}: found ${lines} verse lines, expected ${item.verseCount}`)
  }
  if (macronizedReadings === 0) {
    problems.push(`${slug}: no reading contains editorial macra`)
  }

  console.log(
    `${slug}: chapters=${chapters.length} readings=${readings} ` +
      `verses=${lines} macronized_readings=${macronizedReadings}`,
  )
}

if (problems.length) {
  console.error('\nProblems:')
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}

console.log('\nOK')
