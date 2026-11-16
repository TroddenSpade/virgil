#!/usr/bin/env node
/**
 * Structural checks for the Catullus Carmina data module.
 *
 * The text is long and was generated from the Latin Library edition, so these
 * checks guard the things a regeneration could silently break:
 *   - every chapter is complete and has a non-empty reading
 *   - chapter and reading slugs are unique
 *   - the outline's verseCount matches the actual non-empty paragraphs
 *   - the fragments chapter is present with its three pieces
 *
 * Run with: node scripts/validate-catullus-carmina.mjs
 */
import { book, chapters } from '../src/data/catullus-carmina/index.js'

const problems = []
const warnings = []

const seenChapterSlugs = new Set()
const seenReadingIds = new Set()

for (const chapter of chapters) {
  if (!chapter.complete) problems.push(`${chapter.slug}: chapter is not complete`)
  if (!chapter.readings?.length) problems.push(`${chapter.slug}: no readings`)
  if (seenChapterSlugs.has(chapter.slug)) problems.push(`${chapter.slug}: duplicate chapter slug`)
  seenChapterSlugs.add(chapter.slug)

  let lineCount = 0
  for (const reading of chapter.readings || []) {
    if (!reading.paragraphs?.length) problems.push(`${chapter.slug}/${reading.id}: no paragraphs`)
    if (!reading.paragraphs?.some((paragraph) => paragraph.trim())) {
      problems.push(`${chapter.slug}/${reading.id}: every paragraph is blank`)
    }
    if (seenReadingIds.has(reading.id)) problems.push(`${reading.id}: duplicate reading id`)
    seenReadingIds.add(reading.id)
    lineCount += (reading.paragraphs || []).filter((paragraph) => paragraph.trim()).length
  }

  if (chapter.verseCount !== lineCount) {
    problems.push(
      `${chapter.slug}: verseCount is ${chapter.verseCount}, but the readings contain ${lineCount} non-empty lines`,
    )
  }
}

if (book.chapterCount !== chapters.length) {
  problems.push(`book.chapterCount is ${book.chapterCount}, but there are ${chapters.length} chapters`)
}
if (book.readyCount !== chapters.filter((chapter) => chapter.complete).length) {
  problems.push('book.readyCount does not match the number of complete chapters')
}
if (book.readingCount !== chapters.reduce((total, chapter) => total + (chapter.readings?.length || 0), 0)) {
  problems.push('book.readingCount does not match the number of readings')
}

const fragments = chapters.find((chapter) => chapter.slug === 'fragmenta')
if (!fragments) {
  problems.push('the final Fragmenta chapter is missing')
} else if (fragments.readings?.length !== 3) {
  problems.push(`Fragmenta should contain 3 readings, found ${fragments.readings?.length || 0}`)
}

const numbered = chapters.filter((chapter) => chapter.slug.startsWith('carmen-'))
if (numbered.length !== 118) {
  problems.push(`expected 118 poem chapters, found ${numbered.length}`)
}

const poemChapters = chapters.filter((chapter) => chapter.slug.startsWith('carmen-'))
const seenRoman = new Set()
for (const chapter of poemChapters) {
  if (seenRoman.has(chapter.roman)) problems.push(`duplicate poem number: ${chapter.roman}`)
  seenRoman.add(chapter.roman)
}
if (!seenRoman.has('CXVI')) problems.push('Carmen CXVI is missing')
for (const roman of ['IIb', 'XIVb', 'LVIIIb', 'LXXVIIIb', 'XCVb']) {
  if (!seenRoman.has(roman)) problems.push(`the fragment Carmen ${roman} is missing`)
}

chapters.forEach((chapter, index) => {
  if (chapter.number !== index + 1) {
    problems.push(`${chapter.slug}: expected chapter number ${index + 1}, found ${chapter.number}`)
  }
})

console.log('Catullus Carmina validation')
console.log('===========================')
console.log(`chapters: ${chapters.length}`)
console.log(`poem chapters: ${numbered.length}`)
console.log(`readings: ${chapters.reduce((total, chapter) => total + (chapter.readings?.length || 0), 0)}`)
console.log(`verse lines: ${chapters.reduce((total, chapter) => total + (chapter.verseCount || 0), 0)}`)
console.log(`vocabulary entries: ${chapters.reduce((total, chapter) => total + (chapter.vocabulary?.length || 0), 0)}`)

if (warnings.length) {
  console.log('\nWarnings:')
  for (const warning of warnings) console.log(`  ${warning}`)
}

if (problems.length) {
  console.error('\nProblems:')
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}

console.log('\nOK')
