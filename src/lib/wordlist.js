// The personal wordlist: every word printed in the vocabulary of a chapter
// the learner has marked as learned. It is derived state — nothing is stored
// here. The review history is kept separately in lib/review.js.
//
// Vocabulary entries across the library come in two shapes:
//   { latin, english, pos }                  (course books)
//   { latin, english, group }                (the Companions)
// Some Latin strings carry principal parts ("capitulum, -ī"), a leading
// headword in parentheses ("(crēdō) crēdere, -didisse, -ditum"), or light
// print markup ("{i}often pl.{/i}"). The helpers below reduce all of that to
// a stable headword, a readable display form, and a small set of senses.

import {
  familiaRomanaBook,
  romaAeternaBook,
  exercitiaBook,
  latinViaOvidBook,
  companionBook,
  companionRABook,
} from '../data/library.js'

const VOCABULARY_SOURCE_BOOKS = [
  familiaRomanaBook,
  romaAeternaBook,
  exercitiaBook,
  latinViaOvidBook,
  companionBook,
  companionRABook,
]

const BOOK_ORDER = new Map(
  VOCABULARY_SOURCE_BOOKS.map((book, index) => [book.id, index]),
)

export const VOCABULARY_BOOKS = VOCABULARY_SOURCE_BOOKS.filter((book) =>
  book.chapters.some((chapter) => chapter.vocabulary?.length),
)

const KIND_ORDER = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'preposition',
  'conjunction',
  'numeral',
  'particle',
  'interjection',
  'phrase',
  'other',
]

const KIND_LABELS = {
  noun: 'noun',
  verb: 'verb',
  adjective: 'adjective',
  adverb: 'adverb',
  pronoun: 'pronoun',
  preposition: 'preposition',
  conjunction: 'conjunction',
  numeral: 'numeral',
  particle: 'particle',
  interjection: 'interjection',
  phrase: 'phrase',
  other: 'word',
}

const VOWEL = /[aeiouyāēīōūȳæœ]/i

/** Remove the small print tags used by the source data. */
export function cleanText(value) {
  return String(value || '')
    .replace(/\{\/?[ib]\}/g, ' ')
    .replace(/\{\{\d+\}\}/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Fold macra and case, so "rīpa" and "ripa" share a key. */
export function stripMacra(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/[‑–—]/g, '-')
    .replace(/j/g, 'i')
    .toLowerCase()
}

/** The dictionary headword hidden inside a vocabulary entry. */
export function headwordOf(latin) {
  const clean = cleanText(latin)
  if (!clean) return ''

  // "abs = ā, ab": the first spelling is the headword, the rest a variant.
  const primary = clean.split(/\s*=\s*/)[0]

  const leading = primary.match(/^\(([^)]+)\)/)
  const rawHead = leading
    ? leading[1].split(/[,;/]/)[0].trim()
    : primary.split(/[,;/]/)[0].replace(/\([^)]*\)/g, '').trim()
  // A stray footnote marker ("iussū2") is not part of the word.
  const head = rawHead.replace(/\d+$/, '').trim()

  if (!head || !VOWEL.test(head) || /[+{}]/.test(head)) return ''
  // A handful of Companion rows are stray principal-part suffixes
  // ("-ectum", "-tactum"). Only the true enclitics begin with a hyphen.
  if (/^-/.test(head) && !/^-(?:ne|que|ve)$/i.test(head)) return ''
  return head
}

/** A stable identity for the word, independent of macra and book. */
export function wordKey(latin) {
  const head = headwordOf(latin)
  if (!head) return ''
  const key = stripMacra(head)
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  // Keep the enclitic hyphen: "-ne" is the question particle, "nē" is
  // "lest". Without it the two would share one review card.
  return /^-/.test(head) ? `-${key}` : key
}

/** The principal parts printed after the headword, cleaned for display. */
export function principalOf(latin) {
  const clean = cleanText(latin)
  if (!clean) return ''

  const leading = clean.match(/^\(([^)]+)\)/)
  let rest = leading ? clean.slice(leading[0].length).trim() : clean
  let variant = false

  // "abs = ā, ab": the forms after the equals sign are the variants.
  if (!leading && rest.includes('=')) {
    rest = rest.split(/\s*=\s*/).slice(1).join(' = ')
    variant = true
  }

  // "neque / nec": keep the variant as a second form.
  if (!leading && !variant && !rest.includes(',') && rest.includes('/')) {
    const variants = rest.split('/').map((part) => part.trim()).filter(Boolean)
    if (variants.length > 1 && variants.every((part) => !/\s/.test(part))) {
      return variants.slice(1).join(' / ')
    }
  }

  let parts = rest.split(',').map((part) => part.trim()).filter(Boolean)
  if (!leading && !variant) parts = parts.slice(1)

  const seen = new Set()
  const out = []
  for (const raw of parts) {
    let part = raw
      .replace(/\([^)]*\)/g, '')
      .replace(/\s+(?:often|also|sometimes|or)\s+.*$/i, '')
      .trim()
    if (!part) continue
    if (/\s/.test(part) && !/^[-–—]/.test(part)) part = part.split(/\s+/)[0]
    const key = stripMacra(part)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(part)
  }
  return out.join(', ')
}

/** Headword plus principal parts, as a lexicon prints them. */
export function displayOf(latin) {
  const head = headwordOf(latin)
  if (!head) return ''
  const principal = principalOf(latin)
  return principal ? `${head}, ${principal}` : head
}

const GRAMMAR_NOTE =
  /\b(?:m|f|n|c|pl|sg|prp|prep|abl|acc|gen|dat|sup|intr|tr|adv|conj|pron|also|often|lit|fig|sc|i\.e|e\.g)\b/i

function isGrammarNote(note) {
  const text = note.trim()
  if (!text) return true
  if (/^[+\-–—]/.test(text)) return true
  if (GRAMMAR_NOTE.test(text)) return true
  if (/^[mfnc](?:\.|\s*\/)/i.test(text)) return true
  if (/^pl\.?$/i.test(text)) return true
  return false
}

/** The English sense without the source's leading grammar labels. */
export function cleanEnglish(value) {
  let text = cleanText(value)
  let match
  while ((match = text.match(/^\(([^)]*)\)\s*/))) {
    if (!isGrammarNote(match[1])) break
    text = text.slice(match[0].length)
  }
  return text.replace(/^[,;:\s]+/, '').trim()
}

const KIND_PATTERNS = [
  ['verb', /\b(?:verbs?|verba|coniugat\w*|conjugat\w*|conjug\w*|deponent|impersonal)\b/i],
  ['adjective', /\b(?:adjectives?|adj|adiect\w*|comparativ\w*|superlativ\w*)\b/i],
  ['noun', /\b(?:nouns?|nomina|declensions?|decl)\b/i],
  ['adverb', /\b(?:adverbs?|adv|adverbia)\b/i],
  ['preposition', /\b(?:preps?|prp|praeposit\w*|prepositions?)\b/i],
  ['conjunction', /\b(?:conj\w*|coniunct\w*|conjunctions?)\b/i],
  ['pronoun', /\b(?:prons?|pronom\w*|pronouns?)\b/i],
  ['numeral', /\b(?:num|numer\w*|numerals?)\b/i],
  ['interjection', /\b(?:interj\w*|interiect\w*|interjections?)\b/i],
  ['particle', /\b(?:particles?|enclitic)\b/i],
  ['phrase', /\b(?:phrase|idiom)\b/i],
]

// Fold macra and case but keep "j", so the abbreviation "adj." does not
// become "adi." before it is matched.
function foldLabel(value) {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function kindFromLabel(label) {
  const primary = foldLabel(label).split('/')[0].trim()
  if (!primary) return null
  for (const [kind, pattern] of KIND_PATTERNS) {
    if (pattern.test(primary)) return kind
  }
  if (/\binterrog/.test(primary)) return 'pronoun'
  return null
}

/** The second principal part usually gives away a verb ("capere", "iunt"). */
function hasVerbForm(latin) {
  const parts = cleanText(latin)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const second = parts[1] || ''
  return /(?:[aeēī]re|ere|isse|iunt|unt|ant|iuntur)$/i.test(second)
}

/** A last resort for the Companions' "Alia (Other words)" group. */
function kindFromLatin(latin) {
  const parts = cleanText(latin)
    .replace(/\([^)]*\)/g, ' ')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length < 2) return null

  const secondRaw = parts[1]
  const second = stripMacra(secondRaw).replace(/^-+/, '').trim()
  if (!second) return null
  if (hasVerbForm(latin)) return 'verb'

  const hyphenated = /^-/.test(secondRaw)
  if (hyphenated && /^(?:a|um|e|ius|ior)$/.test(second)) return 'adjective'
  if (hyphenated && /^(?:ae|i|o|em|is|us|ei|onis|atis|utis|udinis)$/.test(second)) {
    return 'noun'
  }
  if (
    !hyphenated &&
    parts.length >= 3 &&
    /^(?:a|um)$/.test(stripMacra(parts[2]).replace(/^-+/, ''))
  ) {
    return 'adjective'
  }
  if (!hyphenated && /(?:is|ae|i|us|ei|onis|atis|utis)$/.test(second)) return 'noun'
  return null
}

/** A coarse part of speech, used only to group senses on the page. */
export function kindOf(entry) {
  const posKind = kindFromLabel(entry.pos)
  if (posKind) return posKind

  const label = cleanText(entry.group)
  const full = stripMacra(label)
  const english = cleanEnglish(entry.english)
  const rawEnglish = cleanText(entry.english)
  const latin = cleanText(entry.latin)

  if (label) {
    if (/^[‑\-–—]/.test(label)) return 'verb'
    if (/^1st\/2nd\b/i.test(full)) return 'adjective'
    if (/^3rd\b/i.test(full) && !/declension/i.test(full)) {
      if (hasVerbForm(latin)) return 'verb'
      if (/\bpronoun\b/i.test(english)) return 'pronoun'
      if (/^\(gen\./i.test(rawEnglish) || /\([^)]*\)/.test(latin)) return 'adjective'
      if (/,\s*-[a-zāēīōūȳ]+$/i.test(latin)) return 'adjective'
      if (/,\s*[a-zāēīōūȳ]+e$/i.test(latin)) return 'adjective'
      if (/^\([mfnc]\./i.test(rawEnglish)) return 'noun'
      return 'noun'
    }
    if (/^(?:1st|2nd|4th|5th|consonant|i-stem|ĭ-stem|indeclinable)\b/i.test(full)) {
      if (/^(?:i-stem|ĭ-stem)\b/i.test(full) && hasVerbForm(latin)) return 'verb'
      return 'noun'
    }
    if (/declension/i.test(full)) return 'noun'
    if (/^irregular\b/i.test(full)) {
      if (/,\s*[^,]*i(?:or|us)\b/i.test(latin)) return 'adjective'
      if (/,\s*[^,]*re\b|\bisse\b/i.test(latin)) return 'verb'
      if (/\b(?:be|go|want|carry|bring|say|prefer|cross|return|offer|eat)\b/i.test(english)) {
        return 'verb'
      }
    }
    const groupKind = kindFromLabel(label)
    if (groupKind) return groupKind
  }

  if (/\bpronoun\b/i.test(english)) return 'pronoun'
  if (/\badjective\b/i.test(english)) return 'adjective'
  if (/\bverb\b/i.test(english)) return 'verb'
  if (/\badverb\b/i.test(english)) return 'adverb'

  // Phrases ("sē cōnferre"), exclamations, then the shape of the Latin.
  const latinParts = latin
    .replace(/\([^)]*\)/g, ' ')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  if (latinParts.some((part) => /\s/.test(part))) return 'phrase'
  if (/!/.test(rawEnglish)) return 'interjection'
  return kindFromLatin(latin) || 'other'
}

function sourceOrder(source) {
  return (BOOK_ORDER.get(source.bookId) ?? 99) * 1000 + source.number
}

export function sourceLabel(source) {
  if (!source) return ''
  return [source.bookShort, source.roman ? `Cap. ${source.roman}` : '']
    .filter(Boolean)
    .join(' · ')
}

export function sourceHref(source) {
  if (!source?.bookSlug) return '/library'
  return source.slug
    ? `/library/${source.bookSlug}/${source.slug}`
    : `/library/${source.bookSlug}`
}

function senseTokens(english) {
  return cleanEnglish(english)
    .split(/[,;]/)
    .map((part) => {
      const stripped = stripMacra(part)
      const withoutNotes = stripped.replace(/\([^)]*\)/g, ' ')
      // A gloss that is wholly parenthetical ("(before tē)") would otherwise
      // vanish; keep its text so the word still has a sense to show.
      const source = withoutNotes.trim() ? withoutNotes : stripped.replace(/[()]/g, ' ')
      return source
        .replace(/[^a-z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    })
    .filter(Boolean)
}

function uniqueBy(values, keyOf) {
  const seen = new Set()
  const out = []
  for (const value of values) {
    const key = keyOf(value)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(value)
  }
  return out
}

/**
 * Pick one representative English gloss for a cluster of overlapping
 * senses. The most specific gloss wins, then the longer one, then the
 * earliest book in the course.
 */
function representativeSense(items) {
  return [...items].sort((a, b) => {
    if (b.tokens.length !== a.tokens.length) return b.tokens.length - a.tokens.length
    if (b.english.length !== a.english.length) return b.english.length - a.english.length
    return sourceOrder(a.entry.source) - sourceOrder(b.entry.source)
  })[0]
}

function senseGroupsFor(entries, best) {
  const byKind = new Map()
  for (const entry of entries) {
    if (!byKind.has(entry.kind)) byKind.set(entry.kind, [])
    byKind.get(entry.kind).push(entry)
  }

  const groups = []
  for (const [kind, items] of byKind) {
    const prepared = items
      .map((entry) => ({
        entry,
        english: cleanEnglish(entry.english),
        tokens: senseTokens(entry.english),
      }))
      .filter((item) => item.english && item.tokens.length)

    if (!prepared.length) continue

    const clusters = []
    for (const item of prepared) {
      let target = clusters.find((cluster) =>
        cluster.tokens.some((token) => item.tokens.includes(token)),
      )
      if (!target) {
        target = { tokens: [], items: [] }
        clusters.push(target)
      }
      target.items.push(item)
      for (const token of item.tokens) {
        if (!target.tokens.includes(token)) target.tokens.push(token)
      }
    }

    const all = uniqueBy(
      [...prepared]
        .sort((a, b) => sourceOrder(a.entry.source) - sourceOrder(b.entry.source))
        .map((item) => item.english),
      (english) => stripMacra(english).replace(/\s+/g, ' '),
    )

    const representatives = clusters
      .map((cluster) => representativeSense(cluster.items).english)
      .filter(Boolean)

    // Keep the gloss under the printed headword first, so the card's
    // display form and its primary sense always agree.
    const bestSense =
      kind === best?.kind && prepared.some((item) => item.entry === best)
        ? cleanEnglish(best.english)
        : ''

    groups.push({
      kind,
      label: KIND_LABELS[kind] || kind,
      primary: bestSense || representatives[0] || all[0],
      all,
    })
  }

  // Sources sometimes disagree on the label for the same gloss ("duo" is a
  // numeral in one book, an adjective in another). Keep one group when the
  // senses are identical, preferring the kind of the printed headword.
  const merged = []
  const bySignature = new Map()
  for (const group of groups) {
    const signature = group.all
      .map((gloss) => stripMacra(gloss).replace(/\s+/g, ' ').trim())
      .sort()
      .join('|')
    const existing = bySignature.get(signature)
    if (!existing) {
      const entry = { ...group }
      merged.push(entry)
      bySignature.set(signature, entry)
      continue
    }
    if (group.kind === best?.kind) {
      existing.kind = group.kind
      existing.label = group.label
      existing.primary = group.primary
    }
  }

  return merged.sort((a, b) => {
    const aBest = a.kind === best?.kind ? 0 : 1
    const bBest = b.kind === best?.kind ? 0 : 1
    return aBest - bBest || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)
  })
}

function displayScore(entry) {
  let score = 0
  if (entry.principal) score += 4
  if (/[āēīōūȳ]/.test(entry.headword)) score += 2
  if (entry.kind !== 'other') score += 1
  if (sourceOrder(entry.source) < 2000) score += 1
  return score
}

function finalizeWord(key, entries) {
  const sortedEntries = [...entries].sort((a, b) => {
    const score = displayScore(b) - displayScore(a)
    if (score !== 0) return score
    return sourceOrder(a.source) - sourceOrder(b.source)
  })

  const best = sortedEntries[0]
  const sources = uniqueBy(
    entries.map((entry) => entry.source).sort((a, b) => sourceOrder(a) - sourceOrder(b)),
    (source) => `${source.bookId}:${source.number}`,
  )
  const senseGroups = senseGroupsFor(entries, best)
  const primary = senseGroups[0] || null

  const haystack = stripMacra(
    [
      best.headword,
      best.display,
      ...senseGroups.flatMap((group) => group.all),
      ...sources.map(sourceLabel),
    ].join(' '),
  )

  return {
    key,
    headword: best.headword,
    principal: best.principal,
    display: best.display,
    kind: primary?.kind || 'other',
    kindLabel: primary?.label || 'word',
    primarySense: primary?.primary || '',
    senseGroups,
    sources,
    sourceCount: sources.length,
    firstSource: sources[0] || null,
    order: Math.min(...sources.map(sourceOrder)),
    haystack,
  }
}

/**
 * Build the wordlist from a progress document ({ books: { [id]: number[] } })
 * or a plain map of book id to learned chapter numbers.
 */
export function buildWordlist(progress) {
  const books = progress?.books && typeof progress.books === 'object'
    ? progress.books
    : progress && typeof progress === 'object'
      ? progress
      : {}

  const studiedChapters = Object.values(books).reduce(
    (sum, numbers) => sum + (Array.isArray(numbers) ? numbers.length : 0),
    0,
  )

  const collected = new Map()
  const chapterSources = []
  let vocabularyChapters = 0

  for (const book of VOCABULARY_BOOKS) {
    const done = new Set(Array.isArray(books[book.id]) ? books[book.id] : [])
    if (!done.size) continue

    for (const chapter of book.chapters) {
      if (!done.has(chapter.number)) continue
      if (!chapter.vocabulary?.length) continue

      vocabularyChapters += 1
      const source = {
        bookId: book.id,
        bookTitle: book.title,
        bookShort: book.shortTitle,
        bookSlug: book.slug,
        number: chapter.number,
        roman: chapter.roman,
        title: chapter.title,
        latinTitle: chapter.latinTitle,
        slug: chapter.slug,
        href: sourceHref({
          bookSlug: book.slug,
          slug: chapter.slug,
        }),
      }
      chapterSources.push(source)

      for (const entry of chapter.vocabulary) {
        const key = wordKey(entry.latin)
        if (!key) continue
        const parsed = {
          key,
          headword: headwordOf(entry.latin),
          principal: principalOf(entry.latin),
          display: displayOf(entry.latin),
          kind: kindOf(entry),
          english: entry.english,
          source,
        }
        if (!collected.has(key)) collected.set(key, [])
        collected.get(key).push(parsed)
      }
    }
  }

  const words = [...collected.entries()]
    .map(([key, entries]) => finalizeWord(key, entries))
    .sort((a, b) => a.headword.localeCompare(b.headword, 'la'))

  const sourceBooks = []
  for (const source of chapterSources) {
    let item = sourceBooks.find((book) => book.id === source.bookId)
    if (!item) {
      item = {
        id: source.bookId,
        title: source.bookTitle,
        shortTitle: source.bookShort,
        slug: source.bookSlug,
        chapters: 0,
      }
      sourceBooks.push(item)
    }
    item.chapters += 1
  }

  return {
    words,
    chapterSources,
    sourceBooks,
    studiedChapters,
    vocabularyChapters,
  }
}
