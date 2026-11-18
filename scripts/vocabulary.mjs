// Shared parsing for the vocabulary printed in the books.
//
// The dictionary builder and its validator must agree about what counts as a
// headword. In particular, a leading parenthetical is the lexical lemma the
// book intends ("(dicitō) dicitāre" is the verb dicitō, not dīcō), and a
// stray principal-part suffix ("-ectum") is not a word at all.
//
// A handful of rows in the OCR'd Cēna Trimalchiōnis glossary are corrupt beyond
// recovery ("argfimentum", "foitfinitus", …). They are listed here explicitly
// so they neither enter the dictionary nor make the coverage audit noisy.

const LETTER = 'A-Za-zĀĒĪŌŪȲÿŸāēīōūȳ'
const VOWEL = /[aeiouyāēīōūȳ]/i

const cleanText = (value) =>
  String(value ?? '')
    .replace(/\{\/?[a-z]+\}/gi, '')
    .replace(/<\/?[a-z]+>/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

export function headwordOf(word) {
  const latin = typeof word === 'string' ? word : word?.latin
  const clean = cleanText(latin)
  if (!clean) return ''

  // "abs = ā, ab": the first spelling is the headword, the rest a variant.
  const primary = clean.split(/\s*=\s*/)[0]
  const leading = primary.match(/^\(([^)]+)\)/)
  const rawHead = leading
    ? leading[1].split(/[,;/]/)[0].trim()
    : primary.split(/[,;/]/)[0].replace(/\([^)]*\)/g, '').trim()
  // A stray footnote marker ("iussū2") is not part of the word.
  let head = rawHead.replace(/\d+$/, '').trim()

  // A handful of Companion rows are stray principal-part suffixes
  // ("-ectum", "-tactum"). Only the true enclitics begin with a hyphen.
  if (/^-/.test(head) && !/^-(?:ne|que|ve)\??$/i.test(head)) return ''
  if (!/^-(?:ne|que|ve)\??$/i.test(head)) {
    head = head
      .replace(new RegExp(`^[^${LETTER}]+`), '')
      .replace(new RegExp(`[^${LETTER}]+$`), '')
      .trim()
  }

  if (!head || !VOWEL.test(head) || /[+{}]/.test(head)) return ''
  return head
}

const foldGroup = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/** The Companion vocabularies label their groups instead of giving a `pos`. */
export function posFromGroup(group, latin = '') {
  const g = foldGroup(group)
  let pos = ''
  if (g.includes('adiect') || g.includes('adjective')) pos = 'adjective'
  else if (g.includes('adverb')) pos = 'adverb'
  else if (g.includes('verb')) pos = 'verb'
  else if (g.includes('praeposit') || g.includes('preposition')) pos = 'preposition'
  else if (g.includes('coniunct') || g.includes('conjunction')) pos = 'conjunction'
  else if (g.includes('interiect') || g.includes('interjection')) pos = 'interjection'
  else if (g.includes('pronom') || g.includes('pronoun')) pos = 'pronoun'
  else if (g.includes('numer') || g.includes('numeral')) pos = 'numeral'
  else if (g.includes('nomina') || g.includes('noun')) pos = 'noun'
  else if (
    /(^|[^a-z])1st\/2nd/.test(g) &&
    /[,;]\s*[-\u2013\u2014]?\s*[a\u0101][,;]\s*[-\u2013\u2014]?\s*[u\u016b]m/i.test(String(latin))
  ) {
    // The Companion's older groups say only "1st/2nd (‑us/er, ‑a, ‑um)".
    pos = 'adjective'
  }

  if (pos === 'noun') {
    const gender = /\(\s*([mfnc])\.\s*\)/i.exec(String(latin))
    if (gender) pos = `noun (${gender[1].toLowerCase()}.)`
  }
  return pos
}

export const CURATED_HEAD_FIXES = new Map([
  // The Companion prints "(illicō) illicere", but the English is "entice,
  // attract": the intended lemma is illiciō, not the adverb illicō.
  ['illico', { head: 'illiciō', latin: 'illiciō, illicere, illexī, illectum' }],
])

export const VOCABULARY_DENYLIST = new Set([
  'petronius-cena-trimalchionis|1|ad-ifitare',
  'petronius-cena-trimalchionis|1|ad-firere',
  'petronius-cena-trimalchionis|1|aflābilitās',
  'petronius-cena-trimalchionis|1|argfimentum',
  'petronius-cena-trimalchionis|1|camārium',
  'petronius-cena-trimalchionis|1|cistema',
  'petronius-cena-trimalchionis|1|col-lfidere',
  'petronius-cena-trimalchionis|1|comb-firere',
  'petronius-cena-trimalchionis|1|congāgātus',
  'petronius-cena-trimalchionis|1|impers',
  'petronius-cena-trimalchionis|1|comeolus',
  'petronius-cena-trimalchionis|1|dē-cemere',
  'petronius-cena-trimalchionis|1|d',
  'petronius-cena-trimalchionis|1|effiisus',
  'petronius-cena-trimalchionis|1|fefellitum',
  'petronius-cena-trimalchionis|1|ferrfiminēre',
  'petronius-cena-trimalchionis|1|gūra',
  'petronius-cena-trimalchionis|1|gūrāre',
  'petronius-cena-trimalchionis|1|fmgere',
  'petronius-cena-trimalchionis|1|flfictus',
  'petronius-cena-trimalchionis|1|foitfinitus',
  'petronius-cena-trimalchionis|1|frfigi',
  'petronius-cena-trimalchionis|1|fiūgālitās',
  'petronius-cena-trimalchionis|1|fiūnīscī',
  'petronius-cena-trimalchionis|1|fimdus',
  'petronius-cena-trimalchionis|1|fimebris',
  'petronius-cena-trimalchionis|1|tīmus',
  'petronius-cena-trimalchionis|1|illmc',
  'petronius-cena-trimalchionis|1|ae',
  'petronius-cena-trimalchionis|1|k',
  'petronius-cena-trimalchionis|1|lātifimdium',
  'petronius-cena-trimalchionis|1|lucema',
  'petronius-cena-trimalchionis|1|m',
  'petronius-cena-trimalchionis|1|matauitatau',
  'petronius-cena-trimalchionis|1|minfitus',
  'petronius-cena-trimalchionis|1|mixcix',
  'petronius-cena-trimalchionis|1|per-firndere',
  'petronius-cena-trimalchionis|1|pema',
  'petronius-cena-trimalchionis|1|prnna',
  'petronius-cena-trimalchionis|1|precirium',
  'petronius-cena-trimalchionis|1|pretiēsus',
  'petronius-cena-trimalchionis|1|rēdere',
  'petronius-cena-trimalchionis|1|re-pēnere',
  'petronius-cena-trimalchionis|1|stolēta',
  'petronius-cena-trimalchionis|1|strfictor',
  'petronius-cena-trimalchionis|1|subalapa',
  'petronius-cena-trimalchionis|1|sub-ōmāre',
  'petronius-cena-trimalchionis|1|thrētium',
  'petronius-cena-trimalchionis|1|ttūdere',
  'petronius-cena-trimalchionis|1|umālis',
  'petronius-cena-trimalchionis|1|vemiculus',
  'petronius-cena-trimalchionis|1|mūrius, -a, -um',
])

export function isDenylisted(slug, chapterNumber, latin) {
  return VOCABULARY_DENYLIST.has(`${slug}|${chapterNumber}|${String(latin ?? '').trim()}`)
}

export { LETTER }
