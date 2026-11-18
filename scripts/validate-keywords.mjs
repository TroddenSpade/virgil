#!/usr/bin/env node
/**
 * Validate the generated chapter keyword labels.
 *
 * Checks that every routable chapter page has keywords, that every keyword
 * has a definition, that the index agrees with the chapter map, and that no
 * keyword is unused.
 */
import { books } from './book-data.mjs'
import {
  chapterKeywords,
  keywordDefinitions,
  keywordGroups,
  keywordIndex,
} from '../src/data/chapter-keywords.generated.js'

const errors = []
const warnings = []
const seen = new Set()
const used = new Set()

for (const book of books) {
  for (const chapter of book.chapters || []) {
    const key = `${book.slug}/${chapter.slug}`
    seen.add(key)
    const tags = chapter.keywords
    if (!Array.isArray(tags)) {
      errors.push(`${key}: chapter.keywords is not an array`)
      continue
    }
    if (tags.length < 3) errors.push(`${key}: only ${tags.length} keywords`)
    if (new Set(tags).size !== tags.length) errors.push(`${key}: duplicate keywords`)
    for (const tag of tags) {
      used.add(tag)
      if (!keywordDefinitions[tag]) errors.push(`${key}: no definition for ${tag}`)
      if (!(keywordIndex[tag] || []).includes(key)) errors.push(`${key}: ${tag} missing from index`)
    }
    if (!tags.some((tag) => tag.startsWith('level:'))) warnings.push(`${key}: no level keyword`)
    if (!tags.some((tag) => tag.startsWith('work:'))) warnings.push(`${key}: no work keyword`)
  }
}

for (const key of Object.keys(chapterKeywords)) {
  if (!seen.has(key)) errors.push(`${key}: keyword entry has no matching chapter`)
}

for (const tag of Object.keys(keywordIndex)) {
  if (!keywordDefinitions[tag]) errors.push(`${tag}: indexed but undefined`)
  if (!used.has(tag)) errors.push(`${tag}: in index but on no chapter`)
  for (const key of keywordIndex[tag]) {
    if (!(chapterKeywords[key] || []).includes(tag)) {
      errors.push(`${tag}: index lists ${key}, but the chapter does not have it`)
    }
  }
}

for (const tag of Object.keys(keywordDefinitions)) {
  if (!used.has(tag)) warnings.push(`${tag}: defined but unused`)
}

const counts = {}
for (const def of Object.values(keywordDefinitions)) {
  counts[def.group] = (counts[def.group] || 0) + 1
}

console.log(`chapters: ${seen.size}`)
console.log(`keyword definitions: ${Object.keys(keywordDefinitions).length}`)
console.log(`keywords per group: ${JSON.stringify(counts)}`)
console.log(`groups: ${Object.keys(keywordGroups).join(', ')}`)
console.log(`warnings: ${warnings.length}`)
for (const warning of warnings.slice(0, 20)) console.log('  warning:', warning)
if (errors.length) {
  console.error(`errors: ${errors.length}`)
  for (const error of errors.slice(0, 30)) console.error('  error:', error)
  process.exit(1)
}
console.log('keyword labels valid')
