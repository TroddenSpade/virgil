#!/usr/bin/env node
/**
 * Structural checks for the nine Ovid works added from the Latin Library.
 *
 * The texts are long and were produced by a parser plus editorial macronization,
 * so these checks guard what a regeneration could silently break:
 *   - the exact chapter and reading counts of each work
 *   - unique book slugs, chapter slugs, and reading ids
 *   - non-empty readings and verse lines
 *   - the outline's verseCount matching the non-empty verse lines
 *   - at least one macronized reading in every book
 *   - the Latīnistae metadata required of an original edition
 *   - a Note on the Text naming the source and the editorial macra
 *
 * Run with: node scripts/validate-ovid-works.mjs
 */
import { book as metamorphoses, chapters as metamorphosesChapters } from '../src/data/ovidius-metamorphoses/index.js'
import { book as amores, chapters as amoresChapters } from '../src/data/ovidius-amores/index.js'
import { book as heroides, chapters as heroidesChapters } from '../src/data/ovidius-heroides/index.js'
import { book as ars, chapters as arsChapters } from '../src/data/ovidius-ars-amatoria/index.js'
import { book as tristia, chapters as tristiaChapters } from '../src/data/ovidius-tristia/index.js'
import { book as ponto, chapters as pontoChapters } from '../src/data/ovidius-ex-ponto/index.js'
import { book as fasti, chapters as fastiChapters } from '../src/data/ovidius-fasti/index.js'
import { book as remedia, chapters as remediaChapters } from '../src/data/ovidius-remedia-amoris/index.js'
import { book as ibis, chapters as ibisChapters } from '../src/data/ovidius-ibis/index.js'

const MACRA = /[āēīōūȳĀĒĪŌŪȲ]/
const CONTROL = /[\u0000-\u001f\u007f\u00ad]/

const expected = [
  {
    book: metamorphoses,
    chapters: metamorphosesChapters,
    chapterCount: 15,
    readingCount: 115,
    verseCount: 11984,
    sourceUnit: 'Lib.',
    url: 'https://www.thelatinlibrary.com/ovid/ovid.met1.shtml',
  },
  {
    book: amores,
    chapters: amoresChapters,
    chapterCount: 3,
    readingCount: 52,
    verseCount: 2459,
    sourceUnit: 'Lib.',
    url: 'https://www.thelatinlibrary.com/ovid/ovid.amor1.shtml',
  },
  {
    book: heroides,
    chapters: heroidesChapters,
    chapterCount: 21,
    readingCount: 21,
    verseCount: 3997,
    sourceUnit: 'Ep.',
    url: 'https://www.thelatinlibrary.com/ovid/ovid.her1.shtml',
  },
  {
    book: ars,
    chapters: arsChapters,
    chapterCount: 3,
    readingCount: 25,
    verseCount: 2330,
    sourceUnit: 'Lib.',
    url: 'https://www.thelatinlibrary.com/ovid/ovid.artis1.shtml',
  },
  {
    book: tristia,
    chapters: tristiaChapters,
    chapterCount: 5,
    readingCount: 51,
    verseCount: 3529,
    sourceUnit: 'Lib.',
    url: 'https://www.thelatinlibrary.com/ovid/ovid.tristia1.shtml',
  },
  {
    book: ponto,
    chapters: pontoChapters,
    chapterCount: 4,
    readingCount: 46,
    verseCount: 3196,
    sourceUnit: 'Lib.',
    url: 'https://www.thelatinlibrary.com/ovid/ovid.ponto1.shtml',
  },
  {
    book: fasti,
    chapters: fastiChapters,
    chapterCount: 6,
    readingCount: 94,
    verseCount: 4727,
    sourceUnit: 'Lib.',
    url: 'https://www.thelatinlibrary.com/ovid/ovid.fasti1.shtml',
  },
  {
    book: remedia,
    chapters: remediaChapters,
    chapterCount: 1,
    readingCount: 9,
    verseCount: 814,
    sourceUnit: 'Lib.',
    url: 'https://www.thelatinlibrary.com/ovid/ovid.rem.shtml',
  },
  {
    book: ibis,
    chapters: ibisChapters,
    chapterCount: 1,
    readingCount: 7,
    verseCount: 642,
    sourceUnit: 'Lib.',
    url: 'https://www.thelatinlibrary.com/ovid/ovid.ibis.shtml',
  },
]

const problems = []
const seenBookSlugs = new Set()
const seenChapterSlugs = new Set()
const seenReadingIds = new Set()

console.log('Ovid works validation')
console.log('=====================')

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
  if (!book.description?.includes('Alatius Latin Macronizer')) {
    problems.push(`${slug}: description does not identify the editorial macra`)
  }
  if (!book.description?.includes('Diacritics menu')) {
    problems.push(`${slug}: description does not mention the Diacritics menu`)
  }

  if (book.slug === 'ovidius-heroides') {
    if (book.unit !== 'Epistula' || book.unitPlural !== 'Epistulae') {
      problems.push(`${slug}: expected Epistula/Epistulae units`)
    }
    if (book.readingUnit !== 'epistula' || book.readingUnitPlural !== 'epistulae') {
      problems.push(`${slug}: expected epistula/epistulae reading units`)
    }
    if (book.collectionLabel !== 'Epistulae' || book.readingLabel !== 'Epistula') {
      problems.push(`${slug}: expected Epistula/Epistulae labels`)
    }
  } else {
    if (book.unit !== 'Liber' || book.unitPlural !== 'Libri') {
      problems.push(`${slug}: expected Liber/Libri units`)
    }
    if (book.readingUnit !== 'liber' || book.readingUnitPlural !== 'libri') {
      problems.push(`${slug}: expected liber/libri reading units`)
    }
    if (book.collectionLabel !== 'Libri' || book.readingLabel !== 'Liber') {
      problems.push(`${slug}: expected Libri/Liber labels`)
    }
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
  if (seenBookSlugs.has(slug)) problems.push(`${slug}: duplicate book slug`)
  seenBookSlugs.add(slug)

  const note = (book.extras || [])
    .flatMap((extra) => extra.sections || [])
    .flatMap((section) => section.blocks || [])
    .map((block) => block.text || '')
    .join('\n')
  if (!note.includes(item.url)) problems.push(`${slug}: Note on the Text lacks the source URL`)
  if (!note.includes('Alatius Latin Macronizer')) {
    problems.push(`${slug}: Note on the Text lacks the editorial-macra note`)
  }
  if (!note.includes('Diacritics menu')) {
    problems.push(`${slug}: Note on the Text does not mention the Diacritics menu`)
  }

  let lines = 0
  let readings = 0
  let macronizedReadings = 0
  const chapterSlugs = new Set()

  for (const chapter of chapters) {
    if (!chapter.complete) problems.push(`${slug}/${chapter.slug}: chapter is not complete`)
    if (chapterSlugs.has(chapter.slug)) problems.push(`${slug}/${chapter.slug}: duplicate chapter slug`)
    if (seenChapterSlugs.has(chapter.slug)) problems.push(`${slug}/${chapter.slug}: duplicate chapter slug across books`)
    chapterSlugs.add(chapter.slug)
    seenChapterSlugs.add(chapter.slug)
    if (!chapter.readings?.length) problems.push(`${slug}/${chapter.slug}: no readings`)
    if (typeof chapter.verseCount !== 'number' || chapter.verseCount <= 0) {
      problems.push(`${slug}/${chapter.slug}: missing or empty verseCount`)
    }

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
      if (reading.paragraphs?.some((paragraph) => CONTROL.test(paragraph))) {
        problems.push(`${slug}/${chapter.slug}/${reading.id}: contains a control character`)
      }
      if (reading.paragraphs?.some((paragraph) => /[+~]/.test(paragraph))) {
        problems.push(`${slug}/${chapter.slug}/${reading.id}: contains unnormalized source markup`)
      }
      if (reading.paragraphs?.some((paragraph) => (paragraph.match(/\{i\}/g) || []).length !== (paragraph.match(/\{\/i\}/g) || []).length)) {
        problems.push(`${slug}/${chapter.slug}/${reading.id}: unbalanced {i} markup`)
      }
      if (reading.paragraphs?.some((paragraph) => /\b\d+\b/.test(paragraph) && /<FONT/i.test(paragraph))) {
        problems.push(`${slug}/${chapter.slug}/${reading.id}: contains a source line number`)
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
