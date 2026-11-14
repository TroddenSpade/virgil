// Build the site dictionary as a full word index.
//
// Every book's vocabulary supplies the curated headwords and meanings. The
// readings are lemmatised with Whitaker's Words, so every inflected form
// found in the books becomes a word entry carrying:
//   - the chapter(s) it was taken from,
//   - its lemma,
//   - the lemma's English sense.
// Headwords with a printed vocabulary meaning keep that meaning; the rest
// take Whitaker's. Every listed word therefore has a sense.
import { createEngine, dictionaryForm } from 'whitakers-words/node'
import { readdirSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const DATA = new URL('../src/data/', import.meta.url)
const OUT = new URL('../src/data/dictionary.generated.js', import.meta.url)

const engine = createEngine()

const LETTER = 'A-Za-zĀĒĪŌŪȲāēīōūȳ'
const TOKEN = /[A-Za-zĀĒĪŌŪȲāēīōūȳÆæŒœ]+/g
const AGE_SCORE = { X: 30, B: 20, C: 10, D: 0, A: -10 }
const FREQ_SCORE = { A: 20, B: 10, C: 5, D: 0, E: -5, F: -10 }

const norm = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/j/g, 'i')
    .toLowerCase()
    .trim()

const cleanForm = (form) =>
  (form || '')
    .split(/\s{2,}/)[0]
    .trim()
    .replace(/^\s*[-–—]\s*,\s*/, '')

const lemmaOf = (form) => {
  for (const part of cleanForm(form).split(',')) {
    const cleaned = part
      .replace(new RegExp(`^[^${LETTER}]+`), '')
      .replace(new RegExp(`[^${LETTER}]+$`), '')
      .trim()
    if (cleaned) return cleaned
  }
  return ''
}

const headwordOf = (w) => {
  for (const part of String(w.latin || '').split(',')) {
    const cleaned = part
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(new RegExp(`^[^${LETTER}]+`), '')
      .replace(new RegExp(`[^${LETTER}]+$`), '')
      .trim()
    if (cleaned) return cleaned
  }
  return ''
}

const POS_LABEL = {
  N: 'noun',
  PRON: 'pronoun',
  PACK: 'pronoun',
  ADJ: 'adjective',
  NUM: 'numeral',
  ADV: 'adverb',
  V: 'verb',
  VPAR: 'participle',
  SUPINE: 'supine',
  PREP: 'preposition',
  CONJ: 'conjunction',
  INTERJ: 'interjection',
  X: 'other',
}

function normalisePos(raw) {
  const p = (raw || '').toLowerCase().replace(/\./g, ' ').replace(/\s+/g, ' ').trim()
  if (!p) return ''
  let label = ''
  if (p.includes('pron')) label = 'pronoun'
  else if (p.includes('participle')) label = 'participle'
  else if (p.includes('particle')) label = 'particle'
  else if (p.includes('noun') || /\bn\b/.test(p)) label = 'noun'
  else if (p.includes('adv')) label = 'adverb'
  else if (p.includes('verb') || /\bv\b/.test(p)) label = 'verb'
  else if (p.includes('adj')) label = 'adjective'
  else if (p.includes('prep')) label = 'preposition'
  else if (p.includes('conj')) label = 'conjunction'
  else if (p.includes('num')) label = 'numeral'
  else if (p.includes('interj')) label = 'interjection'
  else return p

  const gender = /\b([mfn])\b/.exec(p)?.[1]
  return label === 'noun' && gender ? `noun (${gender}.)` : label
}

function posGroup(pos) {
  const p = (pos || '').toLowerCase()
  if (p.includes('pron')) return 'pronoun'
  if (p.includes('participle')) return 'participle'
  if (p.includes('particle')) return 'particle'
  if (p.includes('noun')) return 'noun'
  if (p.includes('adv')) return 'adverb'
  if (p.includes('verb')) return 'verb'
  if (p.includes('adj')) return 'adjective'
  if (p.includes('prep')) return 'preposition'
  if (p.includes('conj')) return 'conjunction'
  if (p.includes('num')) return 'numeral'
  if (p.includes('interj')) return 'interjection'
  return 'other'
}

const cleanText = (s) =>
  (s || '')
    .replace(/\{\/?[a-z]+\}/gi, '')
    .replace(/<\/?[a-z]+>/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

function mergeSenses(set) {
  const out = []
  const seen = new Set()
  for (const raw of set) {
    for (const part of cleanText(raw).split(';')) {
      const text = part.trim()
      if (!text) continue
      const key = norm(text).replace(/\(.*?\)/g, '').trim()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(text)
    }
  }
  return out.join('; ').replace(/[;\s]+$/, '')
}

/* ---------- Load every book ---------- */
const dirs = readdirSync(DATA, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

const books = []
for (const dir of dirs) {
  try {
    const module = await import(pathToFileURL(new URL(`${dir}/index.js`, DATA).pathname).href)
    if (module.chapters?.length) {
      books.push({ slug: dir, book: module.book, chapters: module.chapters })
    }
  } catch {
    /* Not every data folder is a book. */
  }
}

/* ---------- The source table ---------- */
const sources = []
const sourceIds = new Map()

function sourceId(source) {
  const key = `${source.bookSlug}:${source.number}`
  if (sourceIds.has(key)) return sourceIds.get(key)
  const id = sources.length
  sources.push(source)
  sourceIds.set(key, id)
  return id
}

/* ---------- Curated vocabulary ---------- */
const curated = new Map()
for (const { slug, book, chapters } of books) {
  for (const chapter of chapters) {
    const source = {
      book: book?.title || slug,
      bookSlug: slug,
      number: chapter.number,
      roman: chapter.roman,
      title: chapter.title,
      slug: chapter.slug,
    }
    const sid = sourceId(source)
    for (const word of chapter.vocabulary || []) {
      const head = headwordOf(word)
      if (!head) continue
      const key = norm(head)
      let entry = curated.get(key)
      if (!entry) {
        entry = {
          head,
          latin: String(word.latin || '').replace(/^\s*[-–—]\s*,\s*/, ''),
          meanings: new Set(),
          poses: new Set(),
          sourceIds: new Set(),
        }
        curated.set(key, entry)
      }
      if (word.english?.trim()) entry.meanings.add(word.english.trim())
      if (word.pos) entry.poses.add(word.pos)
      entry.sourceIds.add(sid)
    }
  }
}

/* ---------- The readings ---------- */
function sentencesOf(chapter) {
  const out = []
  for (const reading of chapter.readings || []) {
    for (const paragraph of reading.paragraphs || []) {
      const parts = String(paragraph).split(/(?<=[.!?])\s+(?=[A-ZĀĒĪŌŪȲ"“])/)
      for (const raw of parts) {
        const text = raw.trim()
        if (text.length > 14 && text.length < 420) out.push(text)
      }
    }
  }
  return out
}

function bestAnalysis(token) {
  const parsed = engine.parseWord(norm(token))
  const results = (parsed.results || []).filter((r) => r.de?.mean)
  if (!results.length) return null

  let best = null
  let bestScore = -Infinity
  for (const result of results) {
    const lemma = lemmaOf(dictionaryForm(result.de))
    let score = 0
    if (norm(lemma) === norm(token)) score += 100
    if (curated.has(norm(lemma))) score += 40
    score += AGE_SCORE[result.ir?.age] ?? 0
    score += FREQ_SCORE[result.ir?.freq] ?? 0
    if (result.ir?.qual?.pofs === 'VPAR' && norm(lemma) !== norm(token)) score -= 5
    if (score > bestScore) {
      bestScore = score
      best = result
    }
  }
  return best
}

const lemmaMap = new Map()
const wordMap = new Map()

const addWord = (form, lemmaKey, sid) => {
  const key = norm(form)
  if (!key) return
  let word = wordMap.get(key)
  if (!word) {
    word = { w: form, l: lemmaKey, sourceIds: new Set() }
    wordMap.set(key, word)
  }
  if (!/[A-Z]/.test(form)) word.w = form
  if (sid != null) word.sourceIds.add(sid)
}

for (const { slug, book, chapters } of books) {
  for (const chapter of chapters) {
    const source = {
      book: book?.title || slug,
      bookSlug: slug,
      number: chapter.number,
      roman: chapter.roman,
      title: chapter.title,
      slug: chapter.slug,
    }
    const sid = sourceId(source)
    for (const sentence of sentencesOf(chapter)) {
      for (const match of sentence.matchAll(TOKEN)) {
        const token = match[0]
        if (token.length < 2) continue
        if (/^[IVXLCDM]+$/.test(token)) continue

        const analysis = bestAnalysis(token)
        if (!analysis) continue

        const form = cleanForm(dictionaryForm(analysis.de))
        const lemma = lemmaOf(form)
        if (!lemma) continue
        const key = norm(lemma)

        let entry = lemmaMap.get(key)
        if (!entry) {
          const label = POS_LABEL[analysis.de.part.pofs] || 'other'
          const gender = analysis.de.part.n?.gender?.toLowerCase()
          entry = {
            head: lemma,
            latin: form,
            meanings: new Set([analysis.de.mean.trim()]),
            poses: new Set([label === 'noun' && gender ? `noun (${gender}.)` : label]),
            formMap: new Map(),
            sourceIds: new Set(),
            examples: [],
          }
          lemmaMap.set(key, entry)
        }

        const formKey = norm(token)
        const existingForm = entry.formMap.get(formKey)
        if (!existingForm || (/[A-Z]/.test(existingForm) && !/[A-Z]/.test(token))) {
          entry.formMap.set(formKey, token)
        }
        entry.sourceIds.add(sid)
        addWord(token, key, sid)

        if (!entry.examples.length) {
          const marked = sentence.replace(
            new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`),
            `{{${token}}}`,
          )
          if (!entry.examples.some((example) => example.latin === marked)) {
            entry.examples.push({ latin: marked, s: sid })
          }
        }
      }
    }
  }
}

/* Merge the printed vocabulary into the reading lemmas. */
for (const [key, curatedEntry] of curated) {
  let entry = lemmaMap.get(key)
  if (!entry) {
    entry = {
      head: curatedEntry.head,
      latin: curatedEntry.latin,
      meanings: new Set(),
      poses: new Set(),
      formMap: new Map(),
      sourceIds: new Set(),
      examples: [],
    }
    lemmaMap.set(key, entry)
  }
  entry.head = curatedEntry.head
  entry.latin = curatedEntry.latin
  if (curatedEntry.meanings.size) entry.meanings = new Set(curatedEntry.meanings)
  if (curatedEntry.poses.size) entry.poses = new Set(curatedEntry.poses)
  for (const sid of curatedEntry.sourceIds) entry.sourceIds.add(sid)
  for (const sid of curatedEntry.sourceIds) addWord(curatedEntry.head, key, sid)
  addWord(curatedEntry.head, key, null)
}

/* ---------- Finalise ---------- */
const lemmaById = new Map()
const lemmas = [...lemmaMap.entries()]
  .map(([key, entry]) => {
    const english = mergeSenses(entry.meanings)
    const poses = [...new Set([...entry.poses].map(normalisePos).filter(Boolean))]
    const lemma = {
      id: key,
      headword: entry.head,
      latin: entry.latin,
      pos: poses.join('; '),
      posGroup: posGroup(poses[0] || ''),
      english,
      forms: [...entry.formMap.values()].sort((a, b) => a.localeCompare(b)),
      examples: entry.examples,
      s: [...entry.sourceIds].slice(0, 12),
      sn: entry.sourceIds.size,
    }
    if (lemma.english) lemmaById.set(key, lemma)
    return lemma
  })
  .filter((lemma) => lemma.english)
  .sort((a, b) =>
    norm(a.headword).replace(/^[^a-z]+/, '').localeCompare(norm(b.headword).replace(/^[^a-z]+/, '')),
  )

const words = [...wordMap.values()]
  .filter((word) => lemmaById.has(word.l))
  .map((word) => ({
    w: word.w,
    l: word.l,
    s: [...word.sourceIds].slice(0, 12),
    n: word.sourceIds.size,
  }))
  .sort((a, b) => norm(a.w).localeCompare(norm(b.w)))

const letters = [...new Set(words.map((word) => norm(word.w).replace(/^[^a-z]+/, '')[0] || ''))]
  .filter((c) => /[a-z]/.test(c))
  .sort()

const withExamples = lemmas.filter((lemma) => lemma.examples.length).length
const stats = {
  words: words.length,
  lemmas: lemmas.length,
  sources: sources.length,
  withExamples,
}

const banner =
  '// AUTO-GENERATED by scripts/build-dictionary.mjs — do not edit by hand.\n' +
  "// A full word index: every form in the readings, its source chapters, its\n" +
  "// lemma, and the lemma's English sense (course vocabulary + Whitaker's Words).\n"

const js =
  banner +
  'export const sources = ' + JSON.stringify(sources) + '\n\n' +
  'export const lemmas = ' + JSON.stringify(lemmas) + '\n\n' +
  'export const words = ' + JSON.stringify(words) + '\n\n' +
  'export const letters = ' + JSON.stringify(letters) + '\n\n' +
  'export const stats = ' + JSON.stringify(stats) + '\n'

writeFileSync(OUT, js, 'utf8')
console.log({
  books: books.length,
  curated: curated.size,
  words: words.length,
  lemmas: lemmas.length,
  sources: sources.length,
  withExamples,
  missingMeanings: lemmas.filter((lemma) => !lemma.english).length,
  wordsWithoutLemma: words.filter((word) => !lemmaById.has(word.l)).length,
  bytes: js.length,
})
