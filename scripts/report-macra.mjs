#!/usr/bin/env node
/**
 * Review queue for the editorial macra.
 *
 * The texts on the Latīnistae shelf were marked with the Alatius Latin
 * Macronizer. The machine is good but not infallible, and a wrong quantity is
 * worse for a learner than a missing one. This script does not edit anything:
 * it prints the forms that deserve a human look and writes the same findings
 * to reports/macra-review.json.
 *
 * Findings:
 *   1. A sentence-initial word ending in long -ā before a form of esse
 *      (for example "Galliā est omnīs", which should be "Gallia est omnis").
 *   2. A gerundive in -ndā before est ("Vincendā est" → "Vincenda est").
 *   3. The same lemma and folded spelling appearing with conflicting marks,
 *      with the minority variant still frequent enough to matter.
 *   4. Reviewed overrides that no longer match the book text.
 *
 * Usage:
 *   node scripts/report-macra.mjs
 *   node scripts/report-macra.mjs --book caesar-de-bello-gallico
 *   node scripts/report-macra.mjs --limit 50 --json reports/macra-review.json
 *   node scripts/report-macra.mjs --strict
 *
 * Exit status is 0 for a review run; --strict exits 1 when a reviewed
 * override no longer applies.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { books } from './book-data.mjs'
import * as data from '../src/data/dictionary.generated.js'
import { authorShelf } from '../src/data/library.js'
import { buildLexiconIndex, latinTokens, lookupLexicon } from '../src/lib/lexicon.js'
import { allCorrections, applyMacraOverrides } from './macra-overrides.mjs'

const MACRON = /[ĀĒĪŌŪȲāēīōūȳ]/
const ESSE = '(?:est|sunt|erat|erant|erit|erunt|fuit|fuerunt|sit|sint|esset|essent|esse|foret)'
const PREPOSITIONS = new Set([
  'a', 'ab', 'abs', 'ad', 'ante', 'apud', 'circum', 'contra', 'cum', 'de',
  'e', 'ex', 'extra', 'in', 'infra', 'inter', 'intra', 'ob', 'per', 'post',
  'praeter', 'pro', 'propter', 'secundum', 'sine', 'sub', 'super', 'supra',
  'trans', 'ultra',
])

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

function parseArgs(argv) {
  const args = {
    book: null,
    limit: 20,
    json: 'reports/macra-review.json',
    strict: false,
    minCount: 2,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--book') args.book = argv[++index] || null
    else if (arg === '--limit') args.limit = Number(argv[++index]) || args.limit
    else if (arg === '--json') args.json = argv[++index] || args.json
    else if (arg === '--min-count') args.minCount = Number(argv[++index]) || args.minCount
    else if (arg === '--strict') args.strict = true
    else if (arg === '--all') args.limit = Infinity
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node scripts/report-macra.mjs [--book SLUG] [--limit N] [--json PATH] [--strict]')
      process.exit(0)
    } else {
      console.error(`Unknown argument: ${arg}`)
      process.exit(2)
    }
  }

  return args
}

const args = parseArgs(process.argv.slice(2))
const shelf = new Set(authorShelf.slugs)
const selected = args.book
  ? books.filter((book) => book.slug === args.book)
  : books.filter((book) => shelf.has(book.slug))

if (!selected.length) {
  console.error(`No such book on the Latīnistae shelf: ${args.book || '(all)'}`)
  process.exit(2)
}

const index = buildLexiconIndex(data)
const conflicts = new Map()
const highPriority = []
const overrideRows = []
let markedTokens = 0
let allTokens = 0

function locationOf(chapter, reading) {
  return `${chapter.roman || chapter.number || '?'}/${reading.id || reading.title || '?'}`
}

function addHighPriority(entry) {
  highPriority.push(entry)
}

function firstWordBefore(text, start) {
  const before = text.slice(0, start).trimEnd()
  const match = before.match(/([\p{L}]+)\s*$/u)
  return match ? norm(match[1]) : ''
}

function contextOf(text, start, length) {
  const from = Math.max(0, start - 70)
  const to = Math.min(text.length, start + length + 90)
  return `${from > 0 ? '…' : ''}${text.slice(from, to)}${to < text.length ? '…' : ''}`
}

for (const book of selected) {
  for (const chapter of book.chapters || []) {
    for (const reading of chapter.readings || []) {
      for (const paragraph of reading.paragraphs || []) {
        const text = applyMacraOverrides(book.slug, String(paragraph || ''))
        if (!text) continue

        for (const token of latinTokens(text)) {
          if (token.type !== 'word') continue
          allTokens += 1
          if (!MACRON.test(token.value)) continue
          markedTokens += 1

          const lemma = lookupLexicon(index, token.value)?.lemma
          const key = `${lemma?.id || '?'}|${norm(token.value)}`
          let group = conflicts.get(key)
          if (!group) {
            group = {
              lemma: lemma?.id || null,
              headword: lemma?.headword || null,
              variants: new Map(),
              total: 0,
              examples: [],
            }
            conflicts.set(key, group)
          }
          const variant = token.value.toLowerCase()
          group.variants.set(variant, (group.variants.get(variant) || 0) + 1)
          group.total += 1
          if (group.examples.length < 3) {
            group.examples.push(`${book.slug} ${locationOf(chapter, reading)}`)
          }
        }

        // 1. Sentence-initial long -ā before a form of esse. This is the
        //    pattern that produced "Galliā est omnīs" for "Gallia est omnis".
        const sentencePattern = new RegExp(
          `(?<![\\p{L}])([\\p{L}]+ā)\\s+${ESSE}\\b`,
          'gu',
        )
        for (const match of text.matchAll(sentencePattern)) {
          const start = match.index
          const before = text.slice(0, start)
          const atStart = /(^|[.!?…:;\n“"'(])\s*$/u.test(before)
          if (!atStart) continue
          if (PREPOSITIONS.has(firstWordBefore(text, start))) continue

          addHighPriority({
            kind: 'long-a-before-esse',
            book: book.slug,
            location: locationOf(chapter, reading),
            word: match[1],
            next: match[2],
            suggestion: match[1].replace(/ā$/, 'a'),
            context: contextOf(text, start, match[0].length),
          })
        }

        // 2. A gerundive in -ndā before est: Vincendā est → Vincenda est.
        const gerundivePattern = new RegExp(`(?<![\\p{L}])([\\p{L}]+ndā)\\s+(est)\\b`, 'gu')
        for (const match of text.matchAll(gerundivePattern)) {
          addHighPriority({
            kind: 'gerundive-long-a',
            book: book.slug,
            location: locationOf(chapter, reading),
            word: match[1],
            next: match[2],
            suggestion: match[1].replace(/ā$/, 'a'),
            context: contextOf(text, match.index, match[0].length),
          })
        }
      }
    }
  }
}

// Deduplicate rule 1 and rule 2 when a gerundive is also sentence-initial.
const seenHighPriority = new Set()
const highPriorityUnique = highPriority.filter((entry) => {
  const key = `${entry.book}|${entry.location}|${entry.word}|${entry.next}`
  if (seenHighPriority.has(key)) return false
  seenHighPriority.add(key)
  return true
})

const conflictRows = []
for (const group of conflicts.values()) {
  const variants = [...group.variants.entries()].sort((a, b) => b[1] - a[1])
  if (variants.length < 2) continue

  const minority = variants.slice(1).reduce((total, [, count]) => total + count, 0)
  if (minority < args.minCount) continue

  conflictRows.push({
    lemma: group.lemma,
    headword: group.headword,
    variants: variants.map(([form, count]) => ({ form, count })),
    total: group.total,
    minority,
    examples: group.examples,
  })
}
conflictRows.sort((a, b) => b.minority - a.minority || b.total - a.total)

const overrideAudit = []
for (const correction of allCorrections()) {
  if (args.book && correction.book !== args.book) continue
  const book = books.find((candidate) => candidate.slug === correction.book)
  const blob = book
    ? JSON.stringify({ chapters: book.chapters, extras: book.extras })
    : ''
  const occurrences = blob
    ? blob.split(correction.from).length - 1
    : 0

  overrideAudit.push({
    book: correction.book,
    from: correction.from,
    to: correction.to,
    reviewed: correction.reviewed || null,
    reason: correction.reason || '',
    occurrences,
    stale: occurrences === 0,
  })
}

const staleOverrides = overrideAudit.filter((row) => row.stale)
const report = {
  generatedAt: new Date().toISOString(),
  books: selected.map((book) => book.slug),
  summary: {
    books: selected.length,
    tokens: allTokens,
    markedTokens,
    highPriority: highPriorityUnique.length,
    conflicts: conflictRows.length,
    overrides: overrideAudit.length,
    staleOverrides: staleOverrides.length,
  },
  highPriority: highPriorityUnique,
  conflicts: conflictRows,
  overrides: overrideAudit,
}

console.log('Macra review')
console.log('============')
console.log(`books: ${report.summary.books}`)
console.log(`marked tokens: ${markedTokens.toLocaleString()} of ${allTokens.toLocaleString()}`)
console.log(`reviewed corrections: ${overrideAudit.length} (${staleOverrides.length} stale)`)

const shownHigh = highPriorityUnique.slice(0, args.limit)
console.log(`\nHigh priority (${highPriorityUnique.length})`)
if (!highPriorityUnique.length) {
  console.log('  none')
} else {
  for (const entry of shownHigh) {
    console.log(
      `  ${entry.book} ${entry.location}  ${entry.word} ${entry.next} → ${entry.suggestion}`,
    )
    console.log(`    ${entry.context}`)
  }
  if (highPriorityUnique.length > shownHigh.length) {
    console.log(`  … ${highPriorityUnique.length - shownHigh.length} more in the JSON report`)
  }
}

const shownConflicts = conflictRows.slice(0, args.limit)
console.log(`\nCandidate conflicts (${conflictRows.length})`)
if (!conflictRows.length) {
  console.log('  none')
} else {
  for (const row of shownConflicts) {
    const variants = row.variants.map(({ form, count }) => `${form} (${count})`).join(' / ')
    console.log(`  ${row.lemma || '?'}  ${variants}  @ ${row.examples[0] || '?'}`)
  }
  if (conflictRows.length > shownConflicts.length) {
    console.log(`  … ${conflictRows.length - shownConflicts.length} more in the JSON report`)
  }
}

if (overrideAudit.length) {
  console.log('\nReviewed overrides')
  for (const row of overrideAudit) {
    console.log(
      `  ${row.stale ? 'STALE' : 'ok   '} ${row.book}  ${row.from} → ${row.to}` +
        (row.occurrences ? `  (${row.occurrences}×)` : ''),
    )
  }
}

try {
  mkdirSync(dirname(args.json), { recursive: true })
  writeFileSync(args.json, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`\nReport: ${args.json}`)
} catch (error) {
  console.error(`Could not write report ${args.json}: ${error.message}`)
  process.exitCode = 1
}

if (args.strict && staleOverrides.length) {
  console.error(`\n${staleOverrides.length} reviewed override(s) no longer match the text.`)
  process.exitCode = 1
}
