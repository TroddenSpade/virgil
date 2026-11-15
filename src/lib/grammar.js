// Small, dependency-free helpers for turning Whitaker's grammatical records
// into the labels a reader sees in the lexicon and in a paradigm table.

const CASE = {
  NOM: 'nominative',
  VOC: 'vocative',
  GEN: 'genitive',
  DAT: 'dative',
  ACC: 'accusative',
  ABL: 'ablative',
  LOC: 'locative',
}

const NUMBER = { S: 'singular', P: 'plural' }
const GENDER = {
  M: 'masculine',
  F: 'feminine',
  N: 'neuter',
  C: 'common',
}
const TENSE = {
  PRES: 'present',
  IMPF: 'imperfect',
  FUT: 'future',
  PERF: 'perfect',
  PLUP: 'pluperfect',
  FUTP: 'future perfect',
}
const VOICE = { ACTIVE: 'active', PASSIVE: 'passive' }
const MOOD = {
  IND: 'indicative',
  SUB: 'subjunctive',
  IMP: 'imperative',
  INF: 'infinitive',
  PPL: 'participle',
}
const PERSON = { 1: '1st', 2: '2nd', 3: '3rd' }
const COMPARISON = { COMP: 'comparative', SUPER: 'superlative' }

const joined = (...parts) => parts.filter(Boolean).join(' ')

/**
 * A compact, stable key for one grammatical slot. The same key is used by the
 * build script to deduplicate Whitaker's inflection variants and by the reader
 * to label the surviving form.
 */
export function qualityKey(qual) {
  if (!qual?.pofs) return ''

  switch (qual.pofs) {
    case 'N':
      return `N|${qual.noun?.cs || ''}|${qual.noun?.number || ''}|${qual.noun?.gender || ''}`
    case 'PRON':
      return `PRON|${qual.pron?.cs || ''}|${qual.pron?.number || ''}|${qual.pron?.gender || ''}`
    case 'PACK':
      return `PACK|${qual.pack?.cs || ''}|${qual.pack?.number || ''}|${qual.pack?.gender || ''}`
    case 'ADJ':
      return `ADJ|${qual.adj?.cs || ''}|${qual.adj?.number || ''}|${qual.adj?.gender || ''}|${qual.adj?.comparison || ''}`
    case 'NUM':
      return `NUM|${qual.num?.cs || ''}|${qual.num?.number || ''}|${qual.num?.gender || ''}`
    case 'ADV':
      return `ADV|${qual.adv?.comparison || ''}`
    case 'V':
      return `V|${qual.verb?.tenseVoiceMood?.tense || ''}|${qual.verb?.tenseVoiceMood?.voice || ''}|${qual.verb?.tenseVoiceMood?.mood || ''}|${qual.verb?.person || 0}|${qual.verb?.number || ''}`
    case 'VPAR':
      return `VPAR|${qual.vpar?.cs || ''}|${qual.vpar?.number || ''}|${qual.vpar?.gender || ''}|${qual.vpar?.tenseVoiceMood?.tense || ''}|${qual.vpar?.tenseVoiceMood?.voice || ''}|${qual.vpar?.tenseVoiceMood?.mood || ''}`
    case 'SUPINE':
      return `SUPINE|${qual.supine?.cs || ''}|${qual.supine?.number || ''}|${qual.supine?.gender || ''}`
    case 'PREP':
      return `PREP|${qual.prep?.cs || ''}`
    default:
      return qual.pofs
  }
}

function nominalLabel(cs, number, gender) {
  return joined(CASE[cs], NUMBER[number], GENDER[gender])
}

function verbLabel(tense, voice, mood, person, number) {
  const base = joined(TENSE[tense], VOICE[voice], MOOD[mood])
  if (!base) return ''
  if (MOOD[mood] === 'infinitive') return base
  if (PERSON[person] || NUMBER[number]) {
    return `${base}, ${PERSON[person] ? `${PERSON[person]} person ` : ''}${NUMBER[number] || ''}`.trim()
  }
  return base
}

/** Human label for a slot key produced by qualityKey(). */
export function slotLabel(key) {
  if (!key) return ''
  const [pofs, ...parts] = key.split('|')

  switch (pofs) {
    case 'N':
    case 'PRON':
    case 'PACK':
    case 'NUM':
      return nominalLabel(parts[0], parts[1], parts[2])
    case 'ADJ': {
      const comparison = COMPARISON[parts[3]] || ''
      return joined(nominalLabel(parts[0], parts[1], parts[2]), comparison)
    }
    case 'ADV':
      return joined(COMPARISON[parts[0]], 'adverb')
    case 'V':
      return verbLabel(parts[0], parts[1], parts[2], Number(parts[3]), parts[4])
    case 'VPAR': {
      const participle = joined(TENSE[parts[3]], VOICE[parts[4]], 'participle')
      return joined(participle, nominalLabel(parts[0], parts[1], parts[2]))
    }
    case 'SUPINE':
      return joined(nominalLabel(parts[0], parts[1], parts[2]), 'supine')
    case 'PREP':
      return parts[0] ? `preposition + ${CASE[parts[0]] || parts[0].toLowerCase()}` : 'preposition'
    case 'CONJ':
      return 'conjunction'
    case 'INTERJ':
      return 'interjection'
    default:
      return String(pofs || '').toLowerCase()
  }
}

/** The heading a paradigm table uses for a slot. */
export function slotGroupLabel(key) {
  if (!key) return ''
  const [pofs, ...parts] = key.split('|')
  switch (pofs) {
    case 'N':
      return 'Noun'
    case 'PRON':
    case 'PACK':
      return 'Pronoun'
    case 'ADJ':
      return 'Adjective'
    case 'NUM':
      return 'Numeral'
    case 'V':
      return slotLabel(`V|${parts[0] || ''}|${parts[1] || ''}|${parts[2] || ''}|0|`)
    case 'VPAR':
      return joined(TENSE[parts[3]], VOICE[parts[4]], 'participle')
    case 'SUPINE':
      return 'Supine'
    case 'ADV':
      return 'Adverb'
    case 'PREP':
      return 'Preposition'
    case 'CONJ':
      return 'Conjunction'
    case 'INTERJ':
      return 'Interjection'
    default:
      return String(pofs || '')
  }
}

/** The parse line shown under a word in the reading popover. */
export function parseLabel(qual) {
  return slotLabel(qualityKey(qual))
}

const NOMINAL_CASE = new Set([
  'nominative',
  'vocative',
  'genitive',
  'dative',
  'accusative',
  'ablative',
  'locative',
])

/**
 * Turn "nominative singular feminine · vocative singular feminine ·
 * ablative singular feminine" into the shorter "nominative, vocative,
 * ablative singular feminine". Verb labels are left alone.
 */
export function formatParseList(value) {
  const labels = String(value || '')
    .split(' · ')
    .map((label) => label.trim())
    .filter(Boolean)
  if (labels.length <= 1) return labels[0] || ''

  const grouped = new Map()
  const other = []
  for (const label of labels) {
    const words = label.split(/\s+/)
    if (words.length < 3 || !NOMINAL_CASE.has(words[0])) {
      other.push(label)
      continue
    }
    const suffix = words.slice(-2).join(' ')
    if (!/^(?:singular|plural) /.test(suffix)) {
      other.push(label)
      continue
    }
    if (!grouped.has(suffix)) grouped.set(suffix, [])
    grouped.get(suffix).push(words[0])
  }

  const parts = []
  for (const [suffix, cases] of grouped) {
    parts.push(`${cases.join(', ')} ${suffix}`)
  }
  parts.push(...other)
  return parts.join(' · ')
}

/** Split a lexicon citation into its printed principal parts. */
export function principalParts(latin) {
  return String(latin || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}
