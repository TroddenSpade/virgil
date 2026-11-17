#!/usr/bin/env node
// Structural validation for the five Caesar data modules added from The Latin
// Library: De Bello Gallico, De Bello Civili, Bellum Alexandrinum,
// Bellum Africum and Bellum Hispaniense.
//
// Run with: node scripts/validate-caesar-works.mjs
import { book as gallico, chapters as gallicoChapters } from '../src/data/caesar-de-bello-gallico/index.js'
import { book as civili, chapters as civiliChapters } from '../src/data/caesar-de-bello-civili/index.js'
import { book as alexandrino, chapters as alexandrinoChapters } from '../src/data/caesar-bellum-alexandrinum/index.js'
import { book as africano, chapters as africanoChapters } from '../src/data/caesar-bellum-africum/index.js'
import { book as hispaniense, chapters as hispanienseChapters } from '../src/data/caesar-bellum-hispaniense/index.js'

const MACRA = /[āēīōūȳĀĒĪŌŪȲ]/
const problems = []
const warnings = []

const works = [
  {
    slug: 'caesar-de-bello-gallico',
    chapterCount: 8,
    readings: [54, 35, 29, 38, 58, 44, 90, 56],
    book: gallico,
    chapters: gallicoChapters,
  },
  {
    slug: 'caesar-de-bello-civili',
    chapterCount: 3,
    readings: [87, 44, 112],
    book: civili,
    chapters: civiliChapters,
  },
  {
    slug: 'caesar-bellum-alexandrinum',
    chapterCount: 1,
    readings: [78],
    book: alexandrino,
    chapters: alexandrinoChapters,
  },
  {
    slug: 'caesar-bellum-africum',
    chapterCount: 1,
    readings: [97],
    book: africano,
    chapters: africanoChapters,
  },
  {
    slug: 'caesar-bellum-hispaniense',
    chapterCount: 1,
    readings: [42],
    book: hispaniense,
    chapters: hispanienseChapters,
  },
]

const allBookSlugs = new Set()
const allChapterSlugs = new Set()
const allReadingIds = new Set()
const stats = {
  books: 0,
  chapters: 0,
  readings: 0,
  paragraphs: 0,
  markedReadings: 0,
  unmarkedReadings: 0,
  words: 0,
}

function latinWords(text) {
  return (String(text).match(/[A-Za-zÀ-ÿ]+/g) || []).length
}

function checkParagraph(where, text) {
  if (typeof text !== 'string') {
    problems.push(`${where}: paragraph is not a string`)
    return
  }
  if (!text.trim()) problems.push(`${where}: empty paragraph`)
  if (!/[A-Za-z]/.test(text)) problems.push(`${where}: no Latin letters`)
  if (/\t/.test(text)) problems.push(`${where}: contains a tab`)
  if (/\u0000|\u001f|\u00ad/.test(text)) problems.push(`${where}: contains a control character`)
  if (/\+/.test(text)) problems.push(`${where}: source + marker left in the text`)
  const opens = (text.match(/\{i\}/g) || []).length
  const closes = (text.match(/\{\/i\}/g) || []).length
  if (opens !== closes) problems.push(`${where}: unbalanced {i} markup (${opens}/${closes})`)
  const bOpens = (text.match(/\{b\}/g) || []).length
  const bCloses = (text.match(/\{\/b\}/g) || []).length
  if (bOpens !== bCloses) problems.push(`${where}: unbalanced {b} markup (${bOpens}/${bCloses})`)
  stats.words += latinWords(text)
}

for (const work of works) {
  const { slug, book, chapters } = work
  stats.books += 1

  if (book.slug !== slug) problems.push(`${slug}: book.slug is ${book.slug}`)
  if (book.id !== slug) problems.push(`${slug}: book.id is ${book.id}`)
  if (allBookSlugs.has(book.slug)) problems.push(`${slug}: duplicate book slug`)
  allBookSlugs.add(book.slug)

  if (book.kind !== 'reader') problems.push(`${slug}: kind should be reader, found ${book.kind}`)
  if (book.status !== 'active') problems.push(`${slug}: status should be active, found ${book.status}`)
  if (book.language !== 'Latin') problems.push(`${slug}: language should be Latin, found ${book.language}`)
  if (book.edition !== 'Digital edition after the Latin Library') {
    problems.push(`${slug}: unexpected edition ${book.edition}`)
  }
  if (book.year !== 2026) problems.push(`${slug}: year should be 2026, found ${book.year}`)
  if (book.publisher !== 'The Latin Library') problems.push(`${slug}: publisher should be The Latin Library`)
  if (book.isbn !== '') problems.push(`${slug}: isbn should be empty, found ${book.isbn}`)
  if (!String(book.level || '').startsWith('Reader — ')) {
    problems.push(`${slug}: level should start with "Reader — ", found ${book.level}`)
  }
  if (book.sourceUnit !== 'Lib.') problems.push(`${slug}: sourceUnit should be Lib., found ${book.sourceUnit}`)
  if (!book.description?.includes('Alatius Latin Macronizer')) {
    problems.push(`${slug}: description does not mention the Alatius Latin Macronizer`)
  }
  if (!book.description?.includes('Diacritics menu')) {
    problems.push(`${slug}: description does not mention the Diacritics menu`)
  }

  if (chapters.length !== work.chapterCount) {
    problems.push(`${slug}: expected ${work.chapterCount} chapters, found ${chapters.length}`)
  }
  if (book.chapterCount !== chapters.length) {
    problems.push(`${slug}: book.chapterCount ${book.chapterCount} != ${chapters.length}`)
  }

  let bookReadingCount = 0
  let bookMarked = 0
  for (const [index, chapter] of chapters.entries()) {
    stats.chapters += 1
    const where = `${slug}/${chapter.slug || `chapter-${index + 1}`}`
    if (chapter.number !== index + 1) {
      problems.push(`${where}: chapter number is ${chapter.number}, expected ${index + 1}`)
    }
    if (!chapter.roman) problems.push(`${where}: missing roman numeral`)
    if (!chapter.slug) problems.push(`${where}: missing chapter slug`)
    if (!chapter.latinTitle) problems.push(`${where}: missing latinTitle`)
    if (!chapter.title) problems.push(`${where}: missing title`)
    if (chapter.status !== 'complete' || chapter.complete !== true) {
      problems.push(`${where}: chapter is not marked complete`)
    }
    if (allChapterSlugs.has(`${slug}:${chapter.slug}`)) problems.push(`${where}: duplicate chapter slug`)
    allChapterSlugs.add(`${slug}:${chapter.slug}`)
    if (!chapter.readings?.length) {
      problems.push(`${where}: no readings`)
      continue
    }
    if (chapter.readings.length !== work.readings[index]) {
      problems.push(`${where}: expected ${work.readings[index]} readings, found ${chapter.readings.length}`)
    }
    bookReadingCount += chapter.readings.length

    let chapterMarked = 0
    for (const reading of chapter.readings) {
      stats.readings += 1
      const rwhere = `${where}/${reading.id || 'reading'}`
      if (!reading.id) problems.push(`${rwhere}: missing reading id`)
      if (allReadingIds.has(`${slug}:${reading.id}`)) problems.push(`${rwhere}: duplicate reading id`)
      allReadingIds.add(`${slug}:${reading.id}`)
      if (!reading.latinTitle) problems.push(`${rwhere}: missing latinTitle`)
      if (!reading.paragraphs?.length) {
        problems.push(`${rwhere}: no paragraphs`)
        continue
      }
      let marked = false
      for (const [i, paragraph] of reading.paragraphs.entries()) {
        stats.paragraphs += 1
        checkParagraph(`${rwhere}/p${i + 1}`, paragraph)
        if (MACRA.test(paragraph)) marked = true
      }
      if (marked) {
        stats.markedReadings += 1
        chapterMarked += 1
        bookMarked += 1
      } else {
        stats.unmarkedReadings += 1
        warnings.push(`${rwhere}: no macra in this reading`)
      }
    }
    if (chapterMarked === 0) problems.push(`${where}: no reading in the chapter has macra`)
  }

  if (book.readingCount !== bookReadingCount) {
    problems.push(`${slug}: book.readingCount ${book.readingCount} != ${bookReadingCount}`)
  }
  if (book.readyCount !== chapters.filter((chapter) => chapter.complete).length) {
    problems.push(`${slug}: book.readyCount does not match complete chapters`)
  }
  if (bookMarked === 0) problems.push(`${slug}: no reading in the book has macra`)

  const extraIds = new Set((book.extras || []).map((extra) => extra.id))
  if (!extraIds.has('de-textu')) problems.push(`${slug}: missing de-textu extras section`)
  for (const extra of book.extras || []) {
    for (const section of extra.sections || []) {
      const text = (section.blocks || []).map((block) => block.text || '').join(' ')
      if (!MACRA.test(text) && !/macra/i.test(text)) {
        problems.push(`${slug}/${extra.id}: text note does not mention macra`)
      }
      if (!text.includes('thelatinlibrary.com')) {
        problems.push(`${slug}/${extra.id}: text note does not give the Latin Library URL`)
      }
    }
  }
}

if (stats.unmarkedReadings) {
  warnings.push(`${stats.unmarkedReadings} reading(s) contain no macra`)
}

console.log('Caesar works validation')
console.log('=======================')
console.log(`books:           ${stats.books}`)
console.log(`chapters:        ${stats.chapters}`)
console.log(`readings:        ${stats.readings}`)
console.log(`paragraphs:      ${stats.paragraphs}`)
console.log(`Latin words:     ${stats.words}`)
console.log(`marked readings: ${stats.markedReadings} / ${stats.readings}`)

if (warnings.length) {
  console.log('\nWarnings:')
  for (const warning of warnings) console.log(`  ${warning}`)
}

if (problems.length) {
  console.error(`\nProblems (${problems.length}):`)
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}

console.log('\nOK')
