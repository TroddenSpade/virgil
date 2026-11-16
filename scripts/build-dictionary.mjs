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
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { parseInflectsFile } from '../node_modules/whitakers-words/dist/lib/parsers/inflects.js'
import { matchAndResolve } from '../node_modules/whitakers-words/dist/lib/engine/word-analysis.js'
import { parseLabel, qualityKey } from '../src/lib/grammar.js'

const DATA = new URL('../src/data/', import.meta.url)
const OUT = new URL('../src/data/dictionary.generated.js', import.meta.url)
const OUT_READING = new URL(
  '../src/data/reading-vocabulary.generated.js',
  import.meta.url,
)
const OUT_PARADIGM = new URL(
  '../src/data/paradigm-rules.generated.js',
  import.meta.url,
)

const engine = createEngine()
const inflects = parseInflectsFile(
  readFileSync(
    new URL('../node_modules/whitakers-words/data/INFLECTS.LAT', import.meta.url),
    'utf8',
  ),
)

const LETTER = 'A-Za-zĀĒĪŌŪȲÿŸāēīōūȳ'
const TOKEN = /[A-Za-zĀĒĪŌŪȲÿŸāēīōūȳÆæŒœ]+/g
const AGE_SCORE = { X: 30, B: 20, C: 10, D: 0, A: -10 }
const FREQ_SCORE = { A: 20, B: 10, C: 5, D: 0, E: -5, F: -10 }

const norm = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/j/g, 'i')
    .replace(/J/g, 'I')
    .replace(/-/g, '')
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
  const raw = String(w.latin || '')
  for (const part of raw.split(',')) {
    const hadVariant = /[\/=…]|\.\.\./.test(part)
    let cleaned = part
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/[\/=…]/g, ' ').replace(/\.\.\./g, ' ')
      .replace(/[!?;:]/g, ' ')
      .trim()
    if (hadVariant) cleaned = cleaned.split(/\s+/)[0] || ''
    cleaned = cleaned
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

// A data directory and the book's public id differ for a few editions
// ("learn-latin" vs "learn-latin-from-the-romans"). The wordlist keys
// progress by book id, so the compact reading index must use that id too.
const bookIdBySlug = new Map(
  books.map(({ slug, book }) => [slug, book?.id || slug]),
)

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

function inferInflection(head, pos, latin) {
  const raw = String(head || '')
  const h = raw.toLowerCase()
  const p = String(pos || '').toLowerCase()
  const entry = String(latin || '')
  if (!h || !/[a-zāēīōūȳ]/.test(h)) return null
  if (
    p.includes('adverb') || p.includes('preposition') || p.includes('conjunction') ||
    p.includes('interjection') || p.includes('pronoun') || p.includes('numeral')
  ) return null

  const genderOf = (value) =>
    /\(m\.\)/.test(value) ? 'M' : /\(f\.\)/.test(value) ? 'F' :
    /\(n\.\)/.test(value) ? 'N' : /\(c\.\)/.test(value) ? 'C' : ''

  const comma = entry.indexOf(',')
  let gen = ''
  if (comma !== -1) {
    const after = entry.slice(comma + 1).trim().replace(/^[-–—]\s*/, '')
    const match = after.match(/^([a-zāēīōūȳ]+)/i)
    if (match) gen = match[1].toLowerCase()
  }

  if (p.includes('verb') || /(āre|are|ēre|ere|īre)$/.test(h)) {
    if (h.endsWith('āre') || h.endsWith('are')) {
      const st = raw.replace(/-/g, '').slice(0, -3)
      return { sig: 'V|1.1|X', stems: [st, st, st + 'av', st + 'at'] }
    }
    if (h.endsWith('ēre')) {
      const st = raw.slice(0, -3)
      return { sig: 'V|2.1|X', stems: [st, st, st + 'u', st + 'it'] }
    }
    if (h.endsWith('īre')) {
      const inf = raw.slice(0, -3)
      const pres = raw.slice(0, -2)
      return { sig: 'V|3.4|X', stems: [pres, inf, inf + 'iv', inf + 'it'] }
    }
    if (h.endsWith('ere')) {
      const st = raw.slice(0, -3)
      return { sig: 'V|3.1|X', stems: [st, st, '', ''] }
    }
  }

  if (p.includes('adjective')) {
    if (h.endsWith('us') || h.endsWith('a') || h.endsWith('um') || h.endsWith('ā')) {
      const st = h.endsWith('us') ? raw.slice(0, -2) : raw.slice(0, -1)
      return { sig: 'ADJ|1.1|POS', stems: [st, st, '', ''] }
    }
    if (h.endsWith('is') || h.endsWith('e') || h.endsWith('ē')) {
      const st = raw.replace(/[ieē]$/i, '')
      return { sig: 'ADJ|3.2|POS', stems: [st, st, '', ''] }
    }
    if (h.endsWith('āx') || h.endsWith('ox')) {
      const st = raw.slice(0, -1) + 'c'
      return { sig: 'ADJ|3.1|POS', stems: [raw, st, '', ''] }
    }
  }

  if (p.includes('noun') || p === '') {
    // Use the printed genitive when the vocabulary gives one.
    if (gen && gen.endsWith('ae')) {
      if (h.endsWith('ās')) {
        const st = raw.slice(0, -2)
        return { sig: 'N|1.8|M|N', stems: [st, st, '', ''] }
      }
      const st = raw.replace(/[aā]$/i, '')
      { const g = genderOf(p); return { sig: g === 'M' ? 'N|1.1|M|T' : g === 'N' ? 'N|1.1|N|T' : 'N|1.1|F|T', stems: [st, st, '', ''] } }
    }
    if (gen === 'ī' || gen.endsWith('ī')) {
      if (h.endsWith('ius')) {
        const st = raw.slice(0, -2)
        return { sig: 'N|2.9|M|N', stems: [st, st, '', ''] }
      }
      if (h.endsWith('os')) {
        const st = raw.slice(0, -2)
        return { sig: 'N|2.6|M|T', stems: [st, st, '', ''] }
      }
      const st = raw.replace(/[uū]s$/i, '')
      return { sig: 'N|2.1|M|P', stems: [st, st, '', ''] }
    }
    if (gen.endsWith('is')) {
      const nomEnds = ['ius', 'ās', 'ēs', 'ōn', 'ō', 'or', 'ox', 'āx', 'is', 'x', 'os', 'us', 'um', 'ā', 'ē', 'a']
      const nomEnd = nomEnds.find((ending) => h.endsWith(ending)) || ''
      const genForm = raw.slice(0, -nomEnd.length) + gen
      const st = genForm.slice(0, -2)
      const g = genderOf(p) || 'M'
      return { sig: `N|3.1|${g}|T`, stems: [raw, st, '', ''] }
    }
    if (gen.endsWith('ūs')) {
      const st = raw.replace(/[uū]s$/i, '')
      return { sig: 'N|4.1|M|T', stems: [st, st, '', ''] }
    }
    if (gen.endsWith('eī') || gen.endsWith('ēī')) {
      const st = raw.replace(/[eē]s$/i, '')
      return { sig: 'N|5.1|F|T', stems: [st, st, '', ''] }
    }

    // No genitive available: infer from the nominative ending.
    if (h.endsWith('ās')) {
      const st = raw.slice(0, -2)
      return { sig: 'N|1.8|M|N', stems: [st, st, '', ''] }
    }
    if (h.endsWith('ae')) {
      const st = raw.slice(0, -2)
      return { sig: 'N|1.1|F|T', stems: [st, st, '', ''] }
    }
    if (h.endsWith('ir')) {
      return { sig: 'N|2.3|M|N', stems: [raw, raw, '', ''] }
    }
    if (h.endsWith('ā')) {
      const st = raw.slice(0, -1)
      { const g = genderOf(p); return { sig: g === 'M' ? 'N|1.1|M|T' : g === 'N' ? 'N|1.1|N|T' : 'N|1.1|F|T', stems: [st, st, '', ''] } }
    }
    if (h.endsWith('a')) {
      const st = raw.slice(0, -1)
      { const g = genderOf(p); return { sig: g === 'M' ? 'N|1.1|M|T' : g === 'N' ? 'N|1.1|N|T' : 'N|1.1|F|T', stems: [st, st, '', ''] } }
    }
    if (h.endsWith('ē')) {
      const st = raw.slice(0, -1)
      return { sig: 'N|1.6|F|T', stems: [st, st, '', ''] }
    }
    if (h.endsWith('ius')) {
      const st = raw.slice(0, -2)
      return { sig: 'N|2.9|M|N', stems: [st, st, '', ''] }
    }
    if (h.endsWith('os')) {
      const st = raw.slice(0, -2)
      return { sig: 'N|2.6|M|T', stems: [st, st, '', ''] }
    }
    if (h.endsWith('us')) {
      const st = raw.slice(0, -2)
      return { sig: 'N|2.1|M|P', stems: [st, st, '', ''] }
    }
    if (h.endsWith('um')) {
      const st = raw.slice(0, -2)
      return { sig: 'N|2.2|N|T', stems: [st, st, '', ''] }
    }
    if (h.endsWith('ōn')) {
      return { sig: 'N|3.1|M|T', stems: [raw, raw, '', ''] }
    }
    if (h.endsWith('ō')) {
      return { sig: 'N|3.1|M|T', stems: [raw, raw + 'n', '', ''] }
    }
    if (h.endsWith('or')) {
      return { sig: 'N|3.1|M|P', stems: [raw, raw.slice(0, -2) + 'ōr', '', ''] }
    }
    if (h.endsWith('is') || h.endsWith('īs')) {
      return { sig: 'N|3.1|F|T', stems: [raw, raw.slice(0, -2), '', ''] }
    }
    if (h.endsWith('ēs')) {
      return { sig: 'N|3.1|M|T', stems: [raw, raw.slice(0, -2), '', ''] }
    }
    if (h.endsWith('x')) {
      return { sig: 'N|3.1|M|T', stems: [raw, raw.slice(0, -1) + 'c', '', ''] }
    }
    if (h.endsWith('ūs')) {
      const st = raw.slice(0, -2)
      return { sig: 'N|4.1|M|T', stems: [st, st, '', ''] }
    }
  }
  return null
}

/* ---------- Curated vocabulary ---------- */
const JUNK_HEADS = new Set([
  'acc', 'abl', 'adv', 'dat', 'gen', 'nom', 'voc', 'prep', 'conj', 'pron',
  'interj', 'num', 'm', 'f', 'n', 'pl', 'sing', 'indecl', 'comp', 'sup',
  'pass', 'part', 'perf', 'imp', 'impers', 'ger', 'gerund', 'gerundive',
  'inf', 'infinitive', 'imperative', 'indicative', 'subjunctive', 'active',
  'passive', 'present', 'future', 'imperfect', 'pluperfect', 'cet', 'etc',
])
const curatedFormLemma = new Map()
const CURATED_ALIASES = {
  vult: 'volo', volt: 'volo', vultis: 'volo', volunt: 'volo',
  es: 'sum', est: 'sum', sunt: 'sum', sumus: 'sum', estis: 'sum',
  it: 'eo', eunt: 'eo', ibat: 'eo', iit: 'eo', itur: 'eo',
}
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
      let head = headwordOf(word)
      if (!head) continue
      const originalHead = head
      let latin = String(word.latin || '').replace(/^\s*[-–—]\s*,\s*/, '')
      // Fold inflected or irregular headwords into their lexical lemma when
      // possible, so the dictionary does not list amo/amat/amant separately.
      if (!head.includes(' ') && !/^[A-ZĀĒĪŌŪȲ]/.test(head)) {
        const alias = CURATED_ALIASES[norm(head)]
        if (alias) {
          head = alias
          latin = alias
        } else {
          const analysis = bestAnalysis(head)
          if (analysis) {
            const lemma = lemmaOf(dictionaryForm(analysis.de))
            if (lemma) {
              head = lemma
              latin = cleanForm(dictionaryForm(analysis.de))
            }
          }
        }
      }
      const key = norm(head).replace(/\s+/g, '')
      if (JUNK_HEADS.has(key)) continue
      const allowConsonantal =
        /numeral|preposition|conjunction/i.test(word.pos || '') ||
        /^[IVXLCDM]+$/.test(originalHead) ||
        /^[A-Z]+$/.test(originalHead)
      if (!/[aeiouyāēīōūȳ]/.test(key) && !allowConsonantal) continue
      if (!originalHead.includes(' ') && norm(originalHead) !== key) {
        curatedFormLemma.set(norm(originalHead), key)
      }
      const inferred = inferInflection(head, word.pos, latin)
      let entry = curated.get(key)
      if (!entry) {
        entry = {
          head,
          latin,
          meanings: new Set(),
          poses: new Set(),
          sourceIds: new Set(),
          sig: inferred?.sig || '',
          stems: inferred?.stems || [],
        }
        curated.set(key, entry)
      } else if (/^[A-ZĀĒĪŌŪȲ]/.test(head) && !/^[A-ZĀĒĪŌŪȲ]/.test(entry.head)) {
        // A proper name shares its spelling with a common noun (Pānsa/pansa);
        // keep the capitalised form and its gender/paradigm.
        entry.head = head
        entry.latin = latin
        if (inferred?.sig) {
          entry.sig = inferred.sig
          entry.stems = inferred.stems
        }
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
        if (text.length > 14) out.push({ text, note: false })
      }
    }
    // Marginal notes are part of the book too: their words must be in the
    // lexicon even when they never occur in the running text.
    for (const note of reading.notes || []) {
      const text = `${note.term || ''} ${note.gloss || ''}`.trim()
      if (text.length >= 8) out.push({ text, note: true })
    }
  }
  return out
}

function bestAnalysis(token) {
  const parsed = engine.parseWord(norm(token))
  const results = (parsed.results || []).filter((r) => r.de?.mean)
  if (!results.length) return null

  const preferred = curatedFormLemma.get(norm(token))
  let best = null
  let bestScore = -Infinity
  for (const result of results) {
    const lemma = lemmaOf(dictionaryForm(result.de))
    let score = 0
    if (norm(lemma) === norm(token)) score += 100
    if (preferred && norm(lemma) === preferred) score += 250
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

/* A compact signature for the dictionary part, used to share one set of
   paradigm-ending recipes among every lemma with the same inflection. */
function partSignature(part) {
  if (!part?.pofs) return ''
  switch (part.pofs) {
    case 'N':
      return `N|${part.n.decl.which}.${part.n.decl.var}|${part.n.gender}|${part.n.kind}`
    case 'V':
      return `V|${part.v.con.which}.${part.v.con.var}|${part.v.kind}`
    case 'ADJ':
      return `ADJ|${part.adj.decl.which}.${part.adj.decl.var}|${part.adj.co}`
    case 'ADV':
      return `ADV|${part.adv.co}`
    case 'PRON':
      return `PRON|${part.pron.decl.which}.${part.pron.decl.var}|${part.pron.kind}`
    case 'PACK':
      return `PACK|${part.pack.decl.which}.${part.pack.decl.var}|${part.pack.kind}`
    case 'NUM':
      return `NUM|${part.num.decl.which}.${part.num.decl.var}|${part.num.sort}`
    case 'PREP':
      return `PREP|${part.prep.obj}`
    default:
      return part.pofs
  }
}

const lemmaMap = new Map()
const wordMap = new Map()
const unknownTokens = []
const surfaceMap = new Map()
const exampleTable = []
const exampleIds = new Map()

/* The reader needs the exact printed form to keep macra and case distinct:
   Rōma (nominative) and Rōmā (ablative) fold to one dictionary key, but they
   are different study cards. Store one best surface form per exact spelling. */
function noteSurface(token, lemmaKey, labels) {
  const key = String(token || '').toLowerCase()
  if (!key || !lemmaKey) return
  const existing = surfaceMap.get(key)
  if (existing) {
    if (/[A-Z]/.test(existing.w) && !/[A-Z]/.test(token)) existing.w = token
    return
  }
  surfaceMap.set(key, { w: token, l: lemmaKey, g: labels.join(' · ') })
}

/* Whitaker's returns every possible parse of a form. Keep the analyses that
   belong to the lemma we chose, so a popover can be honest about forms such
   as puellae (genitive/dative/locative singular, nominative/vocative plural). */
function labelsFor(token) {
  const parsed = engine.parseWord(norm(token))
  const results = (parsed.results || []).filter((result) => result.de?.mean)
  const best = bestAnalysis(token)
  if (!best) return []
  const bestLemma = norm(lemmaOf(dictionaryForm(best.de)))
  const labels = []
  for (const result of results) {
    if (norm(lemmaOf(dictionaryForm(result.de))) !== bestLemma) continue
    const label = parseLabel(result.ir.qual)
    if (label && !labels.includes(label)) labels.push(label)
  }
  return labels
}

/* One shared table of example sentences; each word points at the sentence
   where it first occurs. */
function addExample(latin, sid, vocab = false) {
  const key = `${sid}|${vocab ? 1 : 0}|${latin}`
  if (exampleIds.has(key)) return exampleIds.get(key)
  const id = exampleTable.length
  exampleTable.push({ latin, s: sid, ...(vocab ? { vocab: true } : {}) })
  exampleIds.set(key, id)
  return id
}

const addWord = (form, lemmaKey, sid) => {
  const key = norm(form)
  if (!key) return null
  let word = wordMap.get(key)
  if (!word) {
    word = { w: form, l: lemmaKey, sourceIds: new Set(), e: null }
    wordMap.set(key, word)
  }
  if (!/[A-Z]/.test(form)) word.w = form
  if (sid != null) word.sourceIds.add(sid)
  return word
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
      for (const match of sentence.text.matchAll(TOKEN)) {
        const token = match[0]
        if (token.length < 2) continue
        if (/^[IVXLCDM]+$/.test(token)) continue

        const analysis = bestAnalysis(token)
        if (!analysis) {
          if (!sentence.note && token.length >= 2) {
            unknownTokens.push({ token, sentence: sentence.text, sid })
          }
          continue
        }

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
            de: analysis.de,
            meanings: new Set([analysis.de.mean.trim()]),
            poses: new Set([label === 'noun' && gender ? `noun (${gender}.)` : label]),
            formMap: new Map(),
            sourceIds: new Set(),
            e: null,
          }
          lemmaMap.set(key, entry)
        }

        noteSurface(token, key, labelsFor(token))

        const formKey = norm(token)
        const existingForm = entry.formMap.get(formKey)
        if (!existingForm || (/[A-Z]/.test(existingForm) && !/[A-Z]/.test(token))) {
          entry.formMap.set(formKey, token)
        }
        entry.sourceIds.add(sid)
        const word = addWord(token, key, sid)
        if (word && word.e == null) {
          const marked = sentence.text.replace(
            new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`),
            `{{${token}}}`,
          )
          word.e = addExample(marked, sid)
        }
        if (entry.e == null && word?.e != null) entry.e = word.e
      }
    }
  }
}

/* Merge the printed vocabulary into the reading lemmas. */
for (const [key, curatedEntry] of curated) {
  let entry = lemmaMap.get(key)
  const analysis = bestAnalysis(curatedEntry.head)
  if (!entry) {
    entry = {
      head: curatedEntry.head,
      latin: curatedEntry.latin,
      de: analysis?.de || null,
      meanings: new Set(),
      poses: new Set(),
      formMap: new Map(),
      sourceIds: new Set(),
      e: null,
      sig: curatedEntry.sig || '',
      stems: curatedEntry.stems || [],
    }
    lemmaMap.set(key, entry)
  }
  entry.head = curatedEntry.head
  entry.latin = curatedEntry.latin
  if (!entry.de && analysis?.de) entry.de = analysis.de
  if (curatedEntry.sig && /^[A-ZĀĒĪŌŪȲ]/.test(curatedEntry.head)) {
    entry.sig = curatedEntry.sig
    entry.stems = curatedEntry.stems
  } else if (!entry.de && curatedEntry.sig && !entry.sig) {
    entry.sig = curatedEntry.sig
    entry.stems = curatedEntry.stems
  }
  if (!entry.poses.size && curatedEntry.sig) {
    const parts = curatedEntry.sig.split('|')
    if (parts[0] === 'N') {
      const g = parts[2]
      entry.poses.add(g === 'F' ? 'noun (f.)' : g === 'M' ? 'noun (m.)' : g === 'N' ? 'noun (n.)' : 'noun')
    } else if (parts[0] === 'ADJ') {
      entry.poses.add('adjective')
    } else if (parts[0] === 'V') {
      entry.poses.add('verb')
    }
  }
  if (analysis?.ir?.qual) noteSurface(curatedEntry.head, key, labelsFor(curatedEntry.head))
  if (curatedEntry.meanings.size) entry.meanings = new Set(curatedEntry.meanings)
  if (curatedEntry.poses.size) entry.poses = new Set(curatedEntry.poses)
  const citation = curatedEntry.latin || curatedEntry.head
  for (const sid of curatedEntry.sourceIds) {
    entry.sourceIds.add(sid)
    const word = addWord(curatedEntry.head, key, sid)
    if (word && word.e == null) word.e = addExample(citation, sid, true)
  }
  const headWord = addWord(curatedEntry.head, key, null)

  /* A vocabulary headword may never occur in a reading (a companion's
     glossary, for instance). Give it the glossary line itself as its
     example, tied to the chapter it comes from. */
  if (entry.e == null) {
    const sid = [...entry.sourceIds][0]
    if (sid != null) entry.e = addExample(citation, sid, true)
  }
  if (headWord && headWord.e == null) headWord.e = entry.e
}

/* The printed vocabulary sometimes gives the only reliable lemma for an
   ambiguous form (vult -> volo rather than vultus).  Re-point those forms now
   that every curated lemma exists. */
for (const [form, lemmaKey] of curatedFormLemma) {
  const word = wordMap.get(form)
  const lemma = lemmaMap.get(lemmaKey)
  if (!word || !lemma || word.l === lemmaKey) continue
  const old = lemmaMap.get(word.l)
  if (old) old.formMap.delete(norm(word.w))
  word.l = lemmaKey
  lemma.formMap.set(norm(word.w), word.w)
  for (const sid of word.sourceIds) lemma.sourceIds.add(sid)
}

/* ---------- Resolve the rest of the reading vocabulary ----------
   Whitaker's does not know every proper name, Greek loanword or archaic
   syncopated form.  For those, fall back to the printed vocabulary: strip an
   enclitic and parse the base, or match the longest curated prefix. */
const curatedKeys = [...curated.keys()]
function bestCuratedPrefix(t) {
  let best = null
  let bestLen = 0
  for (const key of curatedKeys) {
    if (key.length < 3) continue
    let n = 0
    while (n < key.length && n < t.length && key[n] === t[n]) n++
    const need = key.length <= 6 ? 3 : 4
    if (n >= need && n > bestLen) {
      bestLen = n
      best = key
    }
  }
  return best ? best : null
}
function ensureLemma(analysis) {
  const form = cleanForm(dictionaryForm(analysis.de))
  const lemma = lemmaOf(form)
  if (!lemma) return null
  const key = norm(lemma)
  if (!lemmaMap.has(key)) {
    const label = POS_LABEL[analysis.de.part.pofs] || 'other'
    const gender = analysis.de.part.n?.gender?.toLowerCase()
    lemmaMap.set(key, {
      head: lemma,
      latin: form,
      de: analysis.de,
      meanings: new Set([analysis.de.mean.trim()]),
      poses: new Set([label === 'noun' && gender ? `noun (${gender}.)` : label]),
      formMap: new Map(),
      sourceIds: new Set(),
      e: null,
    })
  }
  return key
}
function resolveToken(token) {
  const t = norm(token)
  const aliases = {
    mavult: 'malo', mavolt: 'malo', mavoluit: 'malo',
    vult: 'volo', volt: 'volo', vultis: 'volo', volunt: 'volo',
    est: 'sum', es: 'sum', sunt: 'sum', sumus: 'sum', estis: 'sum',
    it: 'eo', eunt: 'eo', ibat: 'eo', iit: 'eo',
    diibus: 'deus', deibus: 'deus', di: 'deus', dii: 'deus',
    nosse: 'novisse', coisse: 'coivisse', coiisse: 'coivisse',
    offla: 'offa', dupunduarius: 'dupondiarius',
    eundem: 'idem', eandem: 'idem', eiusdem: 'idem', naenias: 'nenia', tisicus: 'phthisicus',
    exierat: 'exeo', abistis: 'abeo', fefellitus: 'fallo',
  }
  if (aliases[t]) {
    const a = bestAnalysis(aliases[t])
    if (a) return ensureLemma(a)
    if (lemmaMap.has(aliases[t])) return aliases[t]
  }
  // Syncopated perfects: abiit -> abivit, obiit -> obivit.
  if (t.endsWith('iit')) {
    const a = bestAnalysis(t.slice(0, -2) + 'vit')
    if (a) return ensureLemma(a)
  }
  // plovēbat (archaic) -> pluēbat.
  if (t.startsWith('plov')) {
    const a = bestAnalysis('plu' + t.slice(4))
    if (a) return ensureLemma(a)
  }
  for (const suffix of ['que', 've', 'ne', 'met', 'st']) {
    if (t.length > suffix.length + 2 && t.endsWith(suffix)) {
      const base = t.slice(0, -suffix.length)
      const analysis = bestAnalysis(base)
      if (analysis) {
        const lemma = lemmaOf(dictionaryForm(analysis.de))
        if (lemma) return ensureLemma(analysis) || norm(lemma)
      }
      const hit = bestCuratedPrefix(base)
      if (hit) return hit
    }
  }
  return bestCuratedPrefix(t)
}
for (const u of unknownTokens) {
  const key = resolveToken(u.token)
  if (!key) continue
  const entry = lemmaMap.get(key)
  if (!entry) continue
  const word = addWord(u.token, key, u.sid)
  entry.formMap.set(norm(u.token), u.token)
  entry.sourceIds.add(u.sid)
  if (word && word.e == null) {
    const marked = u.sentence.replace(
      new RegExp(`\\b${u.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`),
      `{{${u.token}}}`,
    )
    word.e = addExample(marked, u.sid)
  }
  if (word?.e != null && (entry.e == null || exampleTable[entry.e]?.vocab)) {
    entry.e = word.e
  }
}

const LEMMA_OVERRIDES = {
  volo: {
    latin: 'volō, velle, voluī (want); volō, volāre, volāvī (fly)',
    english: '1. want, be willing, wish; 2. fly',
  },
}

/* ---------- Finalise ---------- */
const lemmaById = new Map()
const lemmas = [...lemmaMap.entries()]
  .map(([key, entry]) => {
    const english = mergeSenses(entry.meanings)
    const poses = [...new Set([...entry.poses].map(normalisePos).filter(Boolean))]
    const de = entry.de || null
    const stems = entry.stems?.length
      ? entry.stems
      : de
        ? de.stems.map((stem) => (stem && stem !== 'zzz' ? stem : ''))
        : []
    const override = LEMMA_OVERRIDES[key]
    const lemma = {
      id: key,
      headword: entry.head,
      latin: override?.latin || entry.latin,
      pos: poses.join('; '),
      posGroup: posGroup(poses[0] || ''),
      english: override?.english || english,
      stems,
      sig: entry.sig || (de ? partSignature(de.part) : ''),
      forms: [...entry.formMap.values()].sort((a, b) => a.localeCompare(b)),
      e: entry.e,
      s: [...entry.sourceIds],
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
    s: [...word.sourceIds],
    n: word.sourceIds.size,
    e: word.e ?? lemmaById.get(word.l)?.e ?? null,
  }))
  .sort((a, b) => norm(a.w).localeCompare(norm(b.w)))

const surfaceForms = [...surfaceMap.values()]
  .filter((form) => form.l && form.g)
  .sort((a, b) => a.w.localeCompare(b.w))

/* ---------- Paradigm recipes ----------
   One shared set of stem/suffix rules per inflection signature. The reader
   combines these with a lemma's stems to build its full paradigm on demand,
   so the dictionary stays a reasonable size. The first form for each
   grammatical slot wins; Whitaker's lists the ordinary form before the rarer
   variants. */
const partBySignature = new Map()
for (const entry of lemmaMap.values()) {
  if (!entry.de) continue
  const sig = partSignature(entry.de.part)
  if (sig && !partBySignature.has(sig)) partBySignature.set(sig, entry.de.part)
}

const paradigmRules = {}
for (const [sig, part] of partBySignature) {
  const bySlot = new Map()
  for (let stemKey = 1; stemKey <= 4; stemKey += 1) {
    for (const ir of inflects) {
      const resolved = matchAndResolve(ir, part, stemKey)
      if (!resolved) continue
      const slot = qualityKey(resolved.qual)
      if (!slot || bySlot.has(slot)) continue
      bySlot.set(slot, [stemKey, resolved.ending.suf, slot])
    }
  }
  paradigmRules[sig] = [...bySlot.values()]
}

/* Whitaker's lists the i-stem accusative plural (-is) first for third
   declension nouns.  The ordinary accusative plural is -es; prefer it for
   every non-neuter third-declension signature. */
for (const [sig, rules] of Object.entries(paradigmRules)) {
  if (!sig.startsWith('N|3.')) continue
  for (const rule of rules) {
    if (
      rule[2] === 'N|ACC|P|M' ||
      rule[2] === 'N|ACC|P|F' ||
      rule[2] === 'N|ACC|P|C'
    ) {
      rule[1] = 'es'
    }
  }
}

/* ---------- Compact index for the personal wordlist ----------
   The dictionary's public lemma entries cap their source list at 12 to keep
   the lexicon payload small. The wordlist needs the full association, so it
   is emitted here from lemmaMap.sourceIds: one row per lemma and one list of
   lemma indexes per chapter. */
const readingByChapter = new Map()
for (const [index, lemma] of lemmas.entries()) {
  const entry = lemmaMap.get(lemma.id)
  for (const sid of entry?.sourceIds || []) {
    const source = sources[sid]
    if (!source) continue
    const bookId = bookIdBySlug.get(source.bookSlug) || source.bookSlug
    const key = `${bookId}:${source.number}`
    let indexes = readingByChapter.get(key)
    if (!indexes) readingByChapter.set(key, (indexes = []))
    indexes.push(index)
  }
}

const readingChapters = {}
for (const key of [...readingByChapter.keys()].sort()) {
  readingChapters[key] = readingByChapter.get(key).sort((a, b) => a - b)
}
const readingLemmas = lemmas.map((lemma) => [
  lemma.headword,
  lemma.english,
  lemma.posGroup,
])

const letters = [...new Set(words.map((word) => norm(word.w).replace(/^[^a-z]+/, '')[0] || ''))]
  .filter((c) => /[a-z]/.test(c))
  .sort()

const withExamples = lemmas.filter((lemma) => lemma.e != null).length
const wordsWithExamples = words.filter((word) => word.e != null).length
const stats = {
  words: words.length,
  lemmas: lemmas.length,
  sources: sources.length,
  examples: exampleTable.length,
  withExamples,
  wordsWithExamples,
  surfaceForms: surfaceForms.length,
  paradigmSignatures: Object.keys(paradigmRules).length,
}

const banner =
  '// AUTO-GENERATED by scripts/build-dictionary.mjs — do not edit by hand.\n' +
  "// A full word index: every form in the readings, its source chapters, its\n" +
  "// lemma, and the lemma's English sense (course vocabulary + Whitaker's Words).\n"

const js =
  banner +
  'export const sources = ' + JSON.stringify(sources) + '\n\n' +
  'export const examples = ' + JSON.stringify(exampleTable) + '\n\n' +
  'export const lemmas = ' + JSON.stringify(lemmas) + '\n\n' +
  'export const words = ' + JSON.stringify(words) + '\n\n' +
  'export const surfaceForms = ' + JSON.stringify(surfaceForms) + '\n\n' +
  'export const letters = ' + JSON.stringify(letters) + '\n\n' +
  'export const stats = ' + JSON.stringify(stats) + '\n'

writeFileSync(OUT, js, 'utf8')

const paradigmBanner =
  '// AUTO-GENERATED by scripts/build-dictionary.mjs — do not edit by hand.\n' +
  '// Shared stem/suffix recipes for the full paradigm view, keyed by the\n' +
  "// inflection signature stored on each lemma.\n"

const paradigmJs =
  paradigmBanner +
  'export const paradigmRules = ' + JSON.stringify(paradigmRules) + '\n'

writeFileSync(OUT_PARADIGM, paradigmJs, 'utf8')

const readingBanner =
  '// AUTO-GENERATED by scripts/build-dictionary.mjs — do not edit by hand.\n' +
  '// The compact reading index for the personal wordlist: one [headword,\n' +
  "// English, part of speech] row per lemma, and the lemma indexes found in\n" +
  '// each learned chapter.\n'

const readingJs =
  readingBanner +
  'export const readingLemmas = ' + JSON.stringify(readingLemmas) + '\n\n' +
  'export const readingChapters = ' + JSON.stringify(readingChapters) + '\n'

writeFileSync(OUT_READING, readingJs, 'utf8')

console.log({
  books: books.length,
  curated: curated.size,
  words: words.length,
  lemmas: lemmas.length,
  sources: sources.length,
  examples: exampleTable.length,
  withExamples,
  wordsWithExamples,
  surfaceForms: surfaceForms.length,
  paradigmSignatures: Object.keys(paradigmRules).length,
  missingMeanings: lemmas.filter((lemma) => !lemma.english).length,
  wordsWithoutLemma: words.filter((word) => !lemmaById.has(word.l)).length,
  readingLemmas: readingLemmas.length,
  readingChapters: Object.keys(readingChapters).length,
  bytes: js.length,
  paradigmBytes: paradigmJs.length,
  readingBytes: readingJs.length,
})
