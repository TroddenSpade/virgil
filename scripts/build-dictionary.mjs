// Build the site dictionary as a lemma lexicon.
//
// Every book's vocabulary list supplies the curated headwords and meanings.
// The readings are then lemmatised with Whitaker's Words, so each inflected
// form is attached to its headword instead of becoming a bare entry. Every
// entry therefore carries a real English sense; forms are searchable and
// resolve to their lemma.
import { createEngine, dictionaryForm } from 'whitakers-words/node'
import { readdirSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const DATA = new URL('../src/data/', import.meta.url)
const OUT = new URL('../src/data/dictionary.generated.js', import.meta.url)

const engine = createEngine()

const norm = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/j/g, 'i')
    .toLowerCase()
    .trim()

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

/* dictionaryForm() appends the part of speech after two spaces; keep the
   principal parts only. */
const LETTER = 'A-Za-zĀĒĪŌŪȲāēīōūȳ'
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

/* Split on semicolons, drop markup, and merge duplicate senses (also when
   they differ only in a parenthetical note). */
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

const AGE_SCORE = { X: 30, B: 20, C: 10, D: 0, A: -10 }
const FREQ_SCORE = { A: 20, B: 10, C: 5, D: 0, E: -5, F: -10 }

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

/* ---------- Curated vocabulary ---------- */
const curated = new Map()
const addSource = (map, source) => {
  if (!map.has(source.bookSlug)) {
    map.set(source.bookSlug, { book: source.book, bookSlug: source.bookSlug })
  }
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
          sources: new Map(),
        }
        curated.set(key, entry)
      }
      if (word.english?.trim()) entry.meanings.add(word.english.trim())
      if (word.pos) entry.poses.add(word.pos)
      addSource(entry.sources, source)
    }
  }
}

/* ---------- The readings ---------- */
const TOKEN = /[A-Za-zĀĒĪŌŪȲāēīōūȳÆæŒœ]+/g

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

function bestAnalysis(token, curatedMap) {
  const parsed = engine.parseWord(norm(token))
  const results = (parsed.results || []).filter((r) => r.de?.mean)
  if (!results.length) return null

  let best = null
  let bestScore = -Infinity
  for (const result of results) {
    const lemma = lemmaOf(dictionaryForm(result.de))
    let score = 0
    if (norm(lemma) === norm(token)) score += 100
    if (curatedMap.has(norm(lemma))) score += 40
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

const entries = new Map()
const formIndex = {}

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
    for (const sentence of sentencesOf(chapter)) {
      for (const match of sentence.matchAll(TOKEN)) {
        const token = match[0]
        if (token.length < 2) continue
        if (/^[IVXLCDM]+$/.test(token)) continue

        const analysis = bestAnalysis(token, curated)
        if (!analysis) continue

        const form = cleanForm(dictionaryForm(analysis.de))
        const lemma = lemmaOf(form)
        if (!lemma) continue
        const key = norm(lemma)

        let entry = entries.get(key)
        if (!entry) {
          const label = POS_LABEL[analysis.de.part.pofs] || 'other'
          const gender = analysis.de.part.n?.gender?.toLowerCase()
          entry = {
            head: lemma,
            latin: form,
            meanings: new Set([analysis.de.mean.trim()]),
            poses: new Set([label === 'noun' && gender ? `noun (${gender}.)` : label]),
            formMap: new Map(),
            sources: new Map(),
            examples: [],
            curated: false,
          }
          entries.set(key, entry)
        }

        const formKey = norm(token)
        const existingForm = entry.formMap.get(formKey)
        if (!existingForm || (/[A-Z]/.test(existingForm) && !/[A-Z]/.test(token))) {
          entry.formMap.set(formKey, token)
        }
        addSource(entry.sources, source)
        formIndex[formKey] = key

        if (!entry.examples.length) {
          const marked = sentence.replace(
            new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`),
            `{{${token}}}`,
          )
          if (!entry.examples.some((example) => example.latin === marked)) {
            entry.examples.push({ latin: marked, book: source.book, bookSlug: slug })
          }
        }
      }
    }
  }
}

/* Merge the curated vocabulary into the reading lemmas. */
for (const [key, curatedEntry] of curated) {
  let entry = entries.get(key)
  if (!entry) {
    entry = {
      head: curatedEntry.head,
      latin: curatedEntry.latin,
      meanings: new Set(),
      poses: new Set(),
      formMap: new Map(),
      sources: new Map(),
      examples: [],
      curated: true,
    }
    entries.set(key, entry)
  }
  entry.curated = true
  entry.head = curatedEntry.head
  entry.latin = curatedEntry.latin
  /* The printed vocabulary is the authority for a headword's sense and
     part of speech; Whitaker only fills the gaps. */
  if (curatedEntry.meanings.size) entry.meanings = new Set(curatedEntry.meanings)
  if (curatedEntry.poses.size) entry.poses = new Set(curatedEntry.poses)
  for (const [sourceKey, source] of curatedEntry.sources) {
    if (!entry.sources.has(sourceKey)) entry.sources.set(sourceKey, source)
  }
  formIndex[key] = key
}

/* ---------- Finalise ---------- */
const list = [...entries.entries()]
  .map(([key, entry]) => {
    const english = mergeSenses(entry.meanings)
    const poses = [...new Set([...entry.poses].map(normalisePos).filter(Boolean))]
    const forms = [...entry.formMap.values()].sort((a, b) => a.localeCompare(b))
    const pos = poses.join('; ')
    const headword = entry.head
    const letter = norm(headword).replace(/^[^a-z]+/, '')[0] || ''
    return {
      id: key,
      latin: entry.latin,
      headword,
      letter,
      pos,
      posGroup: posGroup(poses[0] || ''),
      english,
      forms,
      sources: [...entry.sources.values()],
      examples: entry.examples,
    }
  })
  .filter((entry) => entry.english)
  .sort((a, b) =>
    norm(a.headword).replace(/^[^a-z]+/, '').localeCompare(norm(b.headword).replace(/^[^a-z]+/, '')),
  )

const letters = [...new Set(list.map((entry) => entry.letter).filter((c) => /[a-z]/.test(c)))].sort()
const withExamples = list.filter((entry) => entry.examples.length).length
const formCount = Object.keys(formIndex).length

const banner =
  '// AUTO-GENERATED by scripts/build-dictionary.mjs — do not edit by hand.\n' +
  "// A lemma lexicon: every headword from the course vocabulary and the readings,\n" +
  "// with Whitaker's Words supplying the senses and the inflected forms.\n"

const js =
  banner +
  'export const entries = ' + JSON.stringify(list) + '\n\n' +
  'export const letters = ' + JSON.stringify(letters) + '\n\n' +
  'export const formIndex = ' + JSON.stringify(formIndex) + '\n\n' +
  'export const stats = ' +
  JSON.stringify({ entries: list.length, forms: formCount, withExamples }) +
  '\n'

writeFileSync(OUT, js, 'utf8')
console.log({
  books: books.length,
  curated: curated.size,
  entries: list.length,
  forms: formCount,
  withExamples,
  missingMeanings: list.filter((entry) => !entry.english).length,
  letters: letters.length,
  bytes: js.length,
})
