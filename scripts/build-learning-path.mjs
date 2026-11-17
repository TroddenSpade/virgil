#!/usr/bin/env node
/**
 * Build the Iter — one road through the whole library, anchored to the route
 * that Lingua Latina takes chapter by chapter.
 *
 * The first year of Lingua Latina (Familia Romana, caps. I–XXXV) is divided
 * into six grammar bands; the second year (Roma Aeterna, caps. XXXVI–LVI) is
 * its own stage. Every companion, exercise book and workbook chapter follows
 * the chapter it accompanies, so the road reads I, II, III … exactly as a
 * student works through the course. The graded readers and the original
 * authors close the road.
 *
 * The alternative courses (Learn Latin from the Romans, Latin via Ovid) are
 * placed in the band their grammar belongs to, after the Lingua Latina family,
 * so they never break the main sequence. Reference matter (answer keys,
 * glossaries, appendices) is left off the road.
 *
 * Output: src/data/learning-path.generated.js
 *
 * Run with: node scripts/build-learning-path.mjs
 * (after `npm run keywords`, which the focus labels depend on)
 */
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { books } from '../src/data/library.js'
import { describeKeyword } from '../src/data/keywords.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/* ------------------------------------------------------------------ */
/* Stages: the Lingua Latina route                                     */
/* ------------------------------------------------------------------ */

const STAGES = [
  {
    id: 'initium',
    latin: 'Initium',
    title: 'First steps',
    blurb:
      'Familia Romana I–VII. How a Latin sentence works before the grammar is named: the noun and its endings, the verb, plain statement and command.',
    range: 'FR I–VII',
    topics: [
      'alphabet', 'parts-of-speech', 'inflection', 'noun', 'verb', 'adjective',
      'adverb', 'preposition', 'conjunction', 'interjection', 'gender', 'number',
      'agreement', 'word-order', 'questions', 'negation', 'commands',
      'present-tense', 'indicative',
    ],
  },
  {
    id: 'casus',
    latin: 'Casus',
    title: 'The cases and the declensions',
    blurb:
      'Familia Romana VIII–XIV. The six cases and the five declensions, the pronouns, the comparison of adjectives, and the first participles.',
    range: 'FR VIII–XIV',
    topics: [
      'case', 'nominative', 'accusative', 'genitive', 'dative', 'ablative',
      'vocative', 'locative', 'declension', 'first-declension',
      'second-declension', 'third-declension', 'fourth-declension',
      'fifth-declension', 'i-stems', 'numerals', 'time', 'place',
      'pronoun', 'personal-pronouns', 'reflexive-pronouns', 'demonstratives',
      'possession', 'comparison', 'word-formation',
    ],
  },
  {
    id: 'tempora',
    latin: 'Tempora',
    title: 'The verb, voice and tenses',
    blurb:
      'Familia Romana XV–XXI. The persons of the verb and the four conjugations, the passive and the deponents, the imperfect, future and perfect.',
    range: 'FR XV–XXI',
    topics: [
      'conjugation', 'first-conjugation', 'second-conjugation',
      'third-conjugation', 'fourth-conjugation', 'principal-parts',
      'verb-stems', 'imperfect-tense', 'future-tense', 'perfect-tense',
      'pluperfect-tense', 'future-perfect', 'active-voice', 'passive-voice',
      'deponent-verbs', 'infinitive', 'irregular-verbs', 'compound-verbs',
    ],
  },
  {
    id: 'verba-nominalia',
    latin: 'Verba nōminālia',
    title: 'Participles and verbal nouns',
    blurb:
      'Familia Romana XXII–XXVI. The supine, the future participle and infinitive, the pluperfect, the imperative of deponents, and the gerund.',
    range: 'FR XXII–XXVI',
    topics: ['participles', 'gerund', 'gerundive', 'supine', 'periphrastic'],
  },
  {
    id: 'subiunctivus',
    latin: 'Subiunctivus',
    title: 'The subjunctive and its clauses',
    blurb:
      'Familia Romana XXVII–XXXIII. The whole subjunctive, purpose and result clauses, indirect commands, and the gerundive — the mood that carries Latin prose.',
    range: 'FR XXVII–XXXIII',
    topics: [
      'subjunctive', 'sequence-of-tenses', 'purpose-clauses',
      'result-clauses', 'indirect-command', 'indirect-statement',
      'indirect-question', 'relative-clauses', 'cum-clauses', 'conditionals',
      'ablative-absolute',
    ],
  },
  {
    id: 'ars-metrica',
    latin: 'Ars mētrica',
    title: 'Verse and the art of grammar',
    blurb:
      'Familia Romana XXXIV–XXXV. Quantity, elision and the hexameter; then the eight parts of speech that crown the first year.',
    range: 'FR XXXIV–XXXV',
    topics: ['prosody', 'meter', 'reading-poetry'],
  },
  {
    id: 'roma-aeterna',
    latin: 'Rōma Aeterna',
    title: 'The second-year course',
    blurb:
      'Roma Aeterna XXXVI–LVI, chapter by chapter: the cases met again in reading, the moods and indirect speech, word-building, and the Dream of Scipio.',
    range: 'RA XXXVI–LVI',
    topics: [],
  },
  {
    id: 'lectiones',
    latin: 'Lēctiōnēs',
    title: 'The graded readers',
    blurb:
      'Longer reading in adapted and paraphrase Latin — the Sermones and the sacred history, and the reading practice of the alternative course — where the grammar met so far is put to work.',
    range: 'Readers',
    groupByBook: true,
    topics: [],
  },
  {
    id: 'auctores',
    latin: 'Auctōrēs',
    title: 'The authors themselves',
    blurb:
      'Original Latin at last, unadapted — Caesar and Sallust in history, Plautus and Petronius on the stage, and the verse of Vergil and Ovid.',
    range: 'Authors',
    groupByBook: true,
    topics: [],
  },
]

const STAGE_ORDER = STAGES.map((stage) => stage.id)
const STAGE_RANK = new Map(STAGE_ORDER.map((id, index) => [id, index]))

/* ------------------------------------------------------------------ */
/* The Lingua Latina route                                             */
/* ------------------------------------------------------------------ */

// The first year is banded by chapter, not by a keyword vote, so that
// Familia Romana always reads I, II, III … and its companions sit beside it.
const FIRST_YEAR_BANDS = [
  { from: 1, to: 7, stage: 'initium' },
  { from: 8, to: 14, stage: 'casus' },
  { from: 15, to: 21, stage: 'tempora' },
  { from: 22, to: 26, stage: 'verba-nominalia' },
  { from: 27, to: 33, stage: 'subiunctivus' },
  { from: 34, to: 35, stage: 'ars-metrica' },
  { from: 36, to: 56, stage: 'roma-aeterna' },
]

function bandForCore(number) {
  const band = FIRST_YEAR_BANDS.find((entry) => number >= entry.from && number <= entry.to)
  return band ? band.stage : null
}

// The books that follow a core Lingua Latina chapter by number.
const CORE_BOOK = {
  'familia-romana': 'familia-romana',
  'exercitia-latina': 'familia-romana',
  'colloquia-personarum': 'familia-romana',
  'fabulae-syrae': 'familia-romana',
  companion: 'familia-romana',
  'roma-aeterna': 'roma-aeterna',
  'exercitia-latina-ii': 'roma-aeterna',
  'companion-roma-aeterna': 'roma-aeterna',
}

// Reading-only editions: their own home at the end of the road.
const READER_BOOKS = new Set(['sermones-romani', 'epitome-historiae-sacrae'])
const READING_ONLY_BOOKS = new Set([
  'colloquia-personarum',
  'fabulae-syrae',
  'sermones-romani',
  'epitome-historiae-sacrae',
])
const AUTHOR_BOOKS = new Set([
  'caesar-de-bello-gallico-vii',
  'sallustius-cicero-catilina',
  'catullus-carmina',
  'cicero-epistulae-ad-familiares',
  'plautus-amphitryo',
  'vergil-aeneis-i-et-iv',
  'ovidii-ars-amatoria',
  'petronius-cena-trimalchionis',
  'caesar-de-bello-gallico',
  'caesar-de-bello-civili',
  'caesar-bellum-alexandrinum',
  'caesar-bellum-africum',
  'caesar-bellum-hispaniense',
  'ovidius-metamorphoses',
  'ovidius-amores',
  'ovidius-heroides',
  'ovidius-ars-amatoria',
  'ovidius-tristia',
  'ovidius-ex-ponto',
  'ovidius-fasti',
  'ovidius-remedia-amoris',
  'ovidius-ibis',
  'vergil-aeneis',
  'vergil-eclogae',
  'vergil-georgica',
  'horatius-sermones',
  'horatius-carmina',
  'horatius-epistulae',
  'horatius-ars-poetica',
  'horatius-carmen-saeculare',
  'horatius-epodi',
])
const ALTERNATIVE_BOOKS = new Set(['learn-latin', 'latin-via-ovid'])

// Look-up matter, not lessons: answer keys, glossaries and appendices.
const EXCLUDED = new Set([
  'learn-latin:capitulum-62', // How to Use the Appendices
  'learn-latin:capitulum-64', // Key to Further Exercises
  'learn-latin:capitulum-65', // Alphabetical Glossary
])

const READING_PRACTICE = /\breading (practice|texts?)\b/i

// A handful of alternative-course chapters whose grammar alone puts them in the
// wrong band.
const TOPIC_OVERRIDES = new Map([
  ['learn-latin:capitulum-30', 'subiunctivus'], // Fear Clauses
  ['learn-latin:capitulum-45', 'tempora'], // Impersonal Verbs
  ['learn-latin:capitulum-47', 'subiunctivus'], // More Subordinate Clauses
  ['learn-latin:capitulum-57', 'subiunctivus'], // Ablative Absolute
  ['learn-latin:capitulum-60', 'verba-nominalia'], // Gerunds I
  ['learn-latin:capitulum-61', 'verba-nominalia'], // Gerunds II
  ['latin-via-ovid:circe', 'verba-nominalia'], // Gerund and Gerundive
])

const LEVEL_RANK = { beginner: 0, elementary: 1, intermediate: 2, advanced: 3 }

// How books are ordered inside a band: the Lingua Latina family first, then the
// alternative courses, then the readers and the authors in a sensible order.
const BOOK_RANK = [
  'familia-romana',
  'exercitia-latina',
  'colloquia-personarum',
  'companion-to-familia-romana',
  'fabulae-syrae',
  'roma-aeterna',
  'exercitia-latina-ii',
  'companion-to-roma-aeterna',
  'learn-latin-from-the-romans',
  'latin-via-ovid',
  'sermones-romani',
  'epitome-historiae-sacrae',
  'caesar-de-bello-gallico-vii',
  'sallustius-cicero-catilina',
  'catullus-carmina',
  'cicero-epistulae-ad-familiares',
  'plautus-amphitryo',
  'petronius-cena-trimalchionis',
  'vergil-aeneis-i-et-iv',
  'ovidii-ars-amatoria',
  'caesar-de-bello-gallico',
  'caesar-de-bello-civili',
  'caesar-bellum-alexandrinum',
  'caesar-bellum-africum',
  'caesar-bellum-hispaniense',
  'ovidius-metamorphoses',
  'ovidius-amores',
  'ovidius-heroides',
  'ovidius-ars-amatoria',
  'ovidius-tristia',
  'ovidius-ex-ponto',
  'ovidius-fasti',
  'ovidius-remedia-amoris',
  'ovidius-ibis',
  'vergil-aeneis',
  'vergil-eclogae',
  'vergil-georgica',
  'horatius-sermones',
  'horatius-carmina',
  'horatius-epistulae',
  'horatius-ars-poetica',
  'horatius-carmen-saeculare',
  'horatius-epodi',
]
const rankOfBook = (slug) => {
  const index = BOOK_RANK.indexOf(slug)
  return index === -1 ? BOOK_RANK.length : index
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function grammarIds(chapter) {
  return (chapter.keywords || []).filter((id) => id.startsWith('grammar:'))
}

function levelOf(chapter) {
  const id = (chapter.keywords || []).find((k) => k.startsWith('level:'))
  return id ? id.split(':')[1] : 'intermediate'
}

// Tags so general that they say nothing about *where* in the course a chapter
// belongs. They only decide a band when nothing more specific is available.
const FOUNDATIONAL = new Set([
  'alphabet', 'parts-of-speech', 'inflection', 'noun', 'verb', 'adjective',
  'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection', 'gender',
  'number', 'case', 'agreement', 'word-order', 'questions', 'negation',
  'commands', 'present-tense', 'indicative', 'active-voice',
])

const TOPIC_BAND = new Map()
for (const stage of STAGES) {
  for (const topic of stage.topics) TOPIC_BAND.set(topic, stage.id)
}
// Pronouns and comparison belong with the nouns, in the Casus band.
for (const topic of ['pronoun', 'personal-pronouns', 'reflexive-pronouns', 'demonstratives', 'possession', 'comparison', 'word-formation']) {
  TOPIC_BAND.set(topic, 'casus')
}

// The focus label shown on a card: the most distinctive grammar tag the
// chapter carries.
function focusOf(chapter) {
  const ids = grammarIds(chapter)
  if (!ids.length) return null
  const topical = ids.find((id) => !FOUNDATIONAL.has(id.slice('grammar:'.length)) && TOPIC_BAND.has(id.slice('grammar:'.length)))
  return describeKeyword(topical || ids[0]).label
}

// A chapter's own grammar heading, trimmed to fit the card: this is more
// faithful than the keyword votes, which can be broader than the lesson.
function shortenTitle(title) {
  let text = String(title || '').trim()
  if (!text) return null
  text = text.replace(/^The\s+/i, '')
  text = text.split(':')[0].trim()
  text = text.replace(/\s*\([^)]*\)\s*$/, '').trim()
  if (text.length > 42) {
    const cut = text.lastIndexOf(' ', 42)
    text = (cut > 20 ? text.slice(0, cut) : text.slice(0, 42)).trim() + '…'
  }
  return text || null
}

function coreFocusOf(chapter) {
  const first = (chapter.grammar || [])[0]
  return (first && shortenTitle(first.title)) || focusOf(chapter)
}

// Where an alternative-course chapter belongs, by its grammar.
function topicBand(chapter) {
  const ids = grammarIds(chapter).map((id) => id.slice('grammar:'.length))
  const placed = ids.filter((id) => TOPIC_BAND.has(id))
  if (!placed.length) return 'lectiones'
  const topical = placed.filter((id) => !FOUNDATIONAL.has(id))
  const pool = topical.length ? topical : placed

  const counts = new Map()
  for (const id of pool) {
    const stage = TOPIC_BAND.get(id)
    counts.set(stage, (counts.get(stage) || 0) + 1)
  }
  let best = null
  let bestCount = -1
  for (const stage of STAGE_ORDER) {
    const count = counts.get(stage) || 0
    if (count >= bestCount && count > 0) {
      best = stage
      bestCount = count
    }
  }
  return best || 'lectiones'
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

const lessonsByStage = new Map(STAGES.map((stage) => [stage.id, []]))
const seen = new Set()
let total = 0
let excluded = 0

// The grammar focus of each first- and second-year chapter, so the companions
// can borrow it instead of their own noisier tags.
const coreFocus = new Map()
for (const book of books) {
  if (book.id !== 'familia-romana' && book.id !== 'roma-aeterna') continue
  for (const chapter of book.chapters || []) {
    coreFocus.set(`${book.id}:${chapter.number}`, coreFocusOf(chapter))
  }
}

for (const book of books) {
  for (const chapter of book.chapters || []) {
    if (!chapter.complete) continue
    const key = `${book.slug}/${chapter.slug}`
    if (EXCLUDED.has(`${book.id}:${chapter.slug}`)) {
      excluded += 1
      continue
    }

    const level = levelOf(chapter)
    const coreBookId = CORE_BOOK[book.id]
    const alternative = ALTERNATIVE_BOOKS.has(book.id)
    const satellite = Boolean(coreBookId) && coreBookId !== book.id
    const title = `${chapter.title || ''} ${chapter.latinTitle || ''}`
    const override = TOPIC_OVERRIDES.get(`${book.id}:${chapter.slug}`)

    let stageId
    let coreNumber = null
    if (coreBookId) {
      // Follow the core course chapter by chapter.
      coreNumber = chapter.number
      stageId = bandForCore(chapter.number)
    } else if (READER_BOOKS.has(book.id)) {
      stageId = 'lectiones'
    } else if (AUTHOR_BOOKS.has(book.id)) {
      stageId = 'auctores'
    } else {
      // Alternative course: reading practice joins the readers, the rest goes
      // to the band of its grammar.
      stageId = READING_PRACTICE.test(title) ? 'lectiones' : override || topicBand(chapter)
    }

    if (!stageId) stageId = 'lectiones'

    const reading =
      READING_ONLY_BOOKS.has(book.id) ||
      AUTHOR_BOOKS.has(book.id) ||
      (alternative && READING_PRACTICE.test(title))

    // A companion takes its core chapter's focus; a reader gets none; an
    // alternative course keeps its own.
    let focus
    if (satellite) focus = coreFocus.get(`${coreBookId}:${chapter.number}`) ?? null
    else if (alternative) focus = reading ? null : focusOf(chapter)
    else if (READER_BOOKS.has(book.id) || AUTHOR_BOOKS.has(book.id)) focus = null
    else focus = coreFocusOf(chapter)

    const lesson = {
      bookSlug: book.slug,
      bookId: book.id,
      bookShort: book.shortTitle || book.title,
      bookMark: book.heroMark || null,
      number: chapter.number,
      roman: chapter.roman || String(chapter.number),
      slug: chapter.slug,
      latinTitle: chapter.latinTitle || null,
      title: chapter.title || null,
      level,
      focus,
      reading,
      alternative,
      core: coreNumber,
      href: `/library/${book.slug}/${chapter.slug}`,
    }

    lessonsByStage.get(stageId).push(lesson)
    seen.add(key)
    total += 1
  }
}

// Order the road.
for (const stage of STAGES) {
  const list = lessonsByStage.get(stage.id)
  if (stage.groupByBook) {
    // The readers and the authors read best grouped by work.
    list.sort(
      (a, b) =>
        LEVEL_RANK[a.level] - LEVEL_RANK[b.level] ||
        rankOfBook(a.bookSlug) - rankOfBook(b.bookSlug) ||
        a.number - b.number,
    )
  } else {
    // Within a band: the Lingua Latina family chapter by chapter, its
    // companions beside each chapter, then the alternative courses.
    list.sort((a, b) => {
      const groupA = a.alternative ? 1 : 0
      const groupB = b.alternative ? 1 : 0
      if (groupA !== groupB) return groupA - groupB
      const coreA = a.core ?? 9999
      const coreB = b.core ?? 9999
      if (coreA !== coreB) return coreA - coreB
      const rankA = rankOfBook(a.bookSlug)
      const rankB = rankOfBook(b.bookSlug)
      if (rankA !== rankB) return rankA - rankB
      return a.number - b.number
    })
  }
  stage.lessons = list.map((lesson) => ({
    ...lesson,
    levelRank: LEVEL_RANK[lesson.level] ?? 2,
  }))
  stage.lessonCount = list.length
  stage.topics = stage.topics.map((topic) => `grammar:${topic}`)
}

// Integrity: every non-excluded complete chapter appears exactly once.
{
  const placed = new Set()
  for (const stage of STAGES) {
    for (const lesson of stage.lessons) {
      const key = `${lesson.bookSlug}/${lesson.slug}`
      if (placed.has(key)) throw new Error(`Iter: duplicate lesson ${key}`)
      placed.add(key)
    }
  }
  let expected = 0
  for (const book of books) {
    for (const chapter of book.chapters || []) {
      if (!chapter.complete) continue
      if (EXCLUDED.has(`${book.id}:${chapter.slug}`)) continue
      expected += 1
      const key = `${book.slug}/${chapter.slug}`
      if (!placed.has(key)) throw new Error(`Iter: missing lesson ${key}`)
    }
  }
  if (placed.size !== expected) {
    throw new Error(`Iter: placed ${placed.size} lessons but expected ${expected}`)
  }
}

const out = `// Generated by scripts/build-learning-path.mjs — do not edit by hand.
// The Iter: the Lingua Latina route through every book in the library. The
// first year is banded by chapter; the second year is its own stage; the
// readers and the authors close the road. Learned state is added at runtime
// from the per-book progress document.

export const iterStages = ${JSON.stringify(STAGES, null, 2)}

export const iterLessonCount = ${total}

export const iterExcludedCount = ${excluded}

export default iterStages
`

await writeFile(join(ROOT, 'src/data/learning-path.generated.js'), out, 'utf8')

console.log('Wrote src/data/learning-path.generated.js')
console.log('lessons:', total, '· reference chapters left off:', excluded)
for (const stage of STAGES) {
  console.log(`  ${stage.id.padEnd(18)} ${String(stage.lessonCount).padStart(4)}  ${stage.latin}`)
}