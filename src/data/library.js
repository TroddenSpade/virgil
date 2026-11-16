import { book as familiaRomana, chapters as familiaRomanaChapters } from './familia-romana/index.js'
import { book as romaAeterna, chapters as romaAeternaChapters } from './roma-aeterna/index.js'
import { book as exercitiaLatina, chapters as exercitiaLatinaChapters } from './exercitia-latina/index.js'
import { book as latinViaOvid, chapters as latinViaOvidChapters } from './latin-via-ovid/index.js'
import { book as companion, chapters as companionChapters } from './companion/index.js'
import { book as colloquia, chapters as colloquiaChapters } from './colloquia-personarum/index.js'
import { book as fabulae, chapters as fabulaeChapters } from './fabulae-syrae/index.js'
import { book as learnLatin, chapters as learnLatinChapters } from './learn-latin/index.js'
import { book as epitome, chapters as epitomeChapters } from './epitome-historiae-sacrae/index.js'
import { book as caesar, chapters as caesarChapters } from './caesar-de-bello-gallico-vii/index.js'
import { book as exercitiaII, chapters as exercitiaIIChapters } from './exercitia-latina-ii/index.js'
import { book as sermones, chapters as sermonesChapters } from './sermones-romani/index.js'
import { sources } from './sources.generated.js'
import { book as petronius, chapters as petroniusChapters } from './petronius-cena-trimalchionis/index.js'
import { book as ars, chapters as arsChapters } from './ovidii-ars-amatoria/index.js'
import { book as companionRA, chapters as companionRAChapters } from './companion-roma-aeterna/index.js'
import { book as aeneis, chapters as aeneisChapters } from './vergil-aeneis-i-et-iv/index.js'
import { book as catilina, chapters as catilinaChapters } from './sallustius-cicero-catilina/index.js'
import { book as amphitryo, chapters as amphitryoChapters } from './plautus-amphitryo/index.js'
import { chapterKeywords } from './chapter-keywords.generated.js'

// Reference sources are the full texts extracted from the source editions.
// Their chapter JSON lives in public/sources/<sourceSlug>/ and is fetched on
// demand, so the app bundle stays small.
const sourceBySlug = Object.fromEntries(sources.map((s) => [s.slug, s]))

function referenceChapters(sourceSlug) {
  const src = sourceBySlug[sourceSlug]
  if (!src) return []
  return src.chapters.map((c) => ({
    id: c.id,
    number: c.number,
    roman: c.roman,
    title: c.title,
    latinTitle: c.latinTitle || null,
    slug: c.id,
    complete: true,
    reference: true,
  }))
}

// Attach the matching full-text id to each Familia Romana chapter so that
// chapters without a written lesson can still be read in the original.
const familiaReference = sourceBySlug['familia-romana']
export const familiaRomanaBook = {
  ...familiaRomana,
  sourceSlug: 'familia-romana',
  referenceChapters: referenceChapters('familia-romana'),
  chapters: familiaRomanaChapters.map((chapter) => ({
    ...chapter,
    referenceId:
      familiaReference?.chapters.find((c) => c.number === chapter.number)?.id || null,
  })),
}

export const romaAeternaBook = {
  ...romaAeterna,
  chapters: romaAeternaChapters,
}

const companionSource = sourceBySlug['companion']
const latinViaOvidSource = sourceBySlug['latin-via-ovid']
const exercitiaSource = sourceBySlug['exercitia']

export const companionBook = {
  ...companion,
  sourceSlug: 'companion',
  referenceChapters: referenceChapters('companion'),
  chapters: companionChapters,
}

export const colloquiaBook = {
  ...colloquia,
  chapters: colloquiaChapters,
}

export const fabulaeBook = {
  ...fabulae,
  chapters: fabulaeChapters,
}

export const amphitryoBook = {
  ...amphitryo,
  chapters: amphitryoChapters,
}


export const catilinaBook = {
  ...catilina,
  chapters: catilinaChapters,
}


export const aeneisBook = {
  ...aeneis,
  chapters: aeneisChapters,
}


export const companionRABook = {
  ...companionRA,
  chapters: companionRAChapters,
}


export const arsBook = {
  ...ars,
  chapters: arsChapters,
}


export const petroniusBook = {
  ...petronius,
  chapters: petroniusChapters,
}


export const epitomeBook = {
  ...epitome,
  chapters: epitomeChapters,
}


export const caesarBook = {
  ...caesar,
  chapters: caesarChapters,
}


export const exercitiaIIBook = {
  ...exercitiaII,
  chapters: exercitiaIIChapters,
}


export const sermonesBook = {
  ...sermones,
  chapters: sermonesChapters,
}


export const learnLatinBook = {
  ...learnLatin,
  chapters: learnLatinChapters,
}

export const latinViaOvidBook = {
  ...latinViaOvid,
  sourceSlug: 'latin-via-ovid',
  referenceChapters: referenceChapters('latin-via-ovid'),
  chapters: latinViaOvidChapters.map((chapter) => ({
    ...chapter,
    referenceId:
      latinViaOvidSource?.chapters.find((c) => c.number === chapter.number)?.id || null,
  })),
}

export const exercitiaBook = {
  ...exercitiaLatina,
  sourceSlug: 'exercitia',
  referenceChapters: referenceChapters('exercitia'),
  chapters: exercitiaLatinaChapters.map((chapter) => ({
    ...chapter,
    referenceId:
      exercitiaSource?.chapters.find((c) => c.number === chapter.number)?.id || null,
  })),
}

export const books = [
  familiaRomanaBook,
  romaAeternaBook,
  exercitiaBook,
  colloquiaBook,
  fabulaeBook,
  sermonesBook,
  epitomeBook,
  exercitiaIIBook,
  caesarBook,
  aeneisBook,
  arsBook,
  petroniusBook,
  catilinaBook,
  amphitryoBook,
  companionRABook,
  companionBook,
  learnLatinBook,
  latinViaOvidBook,
]

const HERO_MARKS = {
  'familia-romana': 'FAM. ROM.',
  'roma-aeterna': 'ROMA AET.',
  'exercitia-latina': 'EXERC. I',
  'colloquia-personarum': 'COLLOQ.',
  'fabulae-syrae': 'FAB. SYR.',
  'sermones-romani': 'SERM. ROM.',
  'epitome-historiae-sacrae': 'EPIT. SACR.',
  'exercitia-latina-ii': 'EXERC. II',
  'caesar-de-bello-gallico-vii': 'BELL. GALL.',
  'vergil-aeneis-i-et-iv': 'AENEIS',
  'ovidii-ars-amatoria': 'ARS AMAT.',
  'petronius-cena-trimalchionis': 'CENA',
  'sallustius-cicero-catilina': 'CATILINA',
  'plautus-amphitryo': 'AMPHITRYO',
  'companion-roma-aeterna': 'COMES II',
  companion: 'COMES I',
  'learn-latin': 'DISC. LAT.',
  'latin-via-ovid': 'LAT. OVID.',
}

for (const book of books) {
  book.heroMark = HERO_MARKS[book.id] || book.shortTitle?.toUpperCase() || 'LIBER'
  for (const chapter of book.chapters || []) {
    chapter.keywords = chapterKeywords[`${book.slug}/${chapter.slug}`] || []
  }
}

export {
  chapterKeywords,
  keywordDefinitions,
  keywordGroups,
  keywordIndex,
} from './chapter-keywords.generated.js'

export function getBook(slug) {
  return books.find((b) => b.slug === slug)
}

export function getSource(slug) {
  return sourceBySlug[slug]
}

export default books