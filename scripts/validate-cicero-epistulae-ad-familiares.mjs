#!/usr/bin/env node
/**
 * Structural checks for the Cicero Epistulae ad Familiares data module.
 *
 * Run with: node scripts/validate-cicero-epistulae-ad-familiares.mjs
 */
import { book, chapters } from '../src/data/cicero-epistulae-ad-familiares/index.js'

const EXPECTED_PER_BOOK = [11, 19, 13, 15, 22, 23, 33, 17, 26, 35, 30, 30, 81, 24, 21, 27]
const problems = []
const seenSlugs = new Set()
const seenRoman = new Set()
const perBook = new Map()

for (const chapter of chapters) {
  if (!chapter.complete) problems.push(`${chapter.roman}: chapter is not complete`)
  if (seenSlugs.has(chapter.slug)) problems.push(`${chapter.roman}: duplicate slug ${chapter.slug}`)
  seenSlugs.add(chapter.slug)
  if (seenRoman.has(chapter.roman)) problems.push(`duplicate letter number ${chapter.roman}`)
  seenRoman.add(chapter.roman)

  const [bookPart, letterPart] = chapter.roman.split('.')
  const index = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI'].indexOf(bookPart) + 1
  if (index < 1) problems.push(`${chapter.roman}: unknown book number`)
  if (!letterPart) problems.push(`${chapter.roman}: missing letter number`)
  perBook.set(index, (perBook.get(index) || 0) + 1)

  if (!chapter.readings?.length) problems.push(`${chapter.roman}: no reading`)
  if (chapter.readings?.length !== 1) problems.push(`${chapter.roman}: expected one reading`)
  for (const reading of chapter.readings || []) {
    if (!reading.paragraphs?.length) problems.push(`${chapter.roman}: no paragraphs`)
    if (!reading.paragraphs?.some((paragraph) => paragraph.trim())) {
      problems.push(`${chapter.roman}: every paragraph is blank`)
    }
  }
}

for (let index = 0; index < EXPECTED_PER_BOOK.length; index += 1) {
  const found = perBook.get(index + 1) || 0
  if (found !== EXPECTED_PER_BOOK[index]) {
    problems.push(`Liber ${index + 1}: expected ${EXPECTED_PER_BOOK[index]} letters, found ${found}`)
  }
}

if (chapters.length !== 427) problems.push(`expected 427 chapters, found ${chapters.length}`)
if (book.chapterCount !== chapters.length) problems.push('book.chapterCount does not match chapters')
if (book.readingCount !== chapters.length) problems.push('book.readingCount does not match chapters')
if (book.readyCount !== chapters.length) problems.push('book.readyCount does not match chapters')

console.log('Cicero Epistulae ad Familiares validation')
console.log('==========================================')
console.log(`chapters: ${chapters.length}`)
console.log(`letters per book: ${JSON.stringify(Object.fromEntries([...perBook.entries()].sort((a,b)=>a[0]-b[0])))}`)
console.log(`paragraphs: ${chapters.reduce((total, chapter) => total + (chapter.readings?.[0]?.paragraphs?.length || 0), 0)}`)

if (problems.length) {
  console.error('\nProblems:')
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}

console.log('\nOK')
