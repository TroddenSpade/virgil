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

// The shelf runs from the first beginner book to the most advanced author.
// Companion and exercise volumes sit beside the course they support.
const BOOK_ORDER = [
  'familia-romana',
  'exercitia-latina',
  'colloquia-personarum',
  'companion-to-familia-romana',
  'learn-latin-from-the-romans',
  'latin-via-ovid',
  'fabulae-syrae',
  'roma-aeterna',
  'exercitia-latina-ii',
  'companion-to-roma-aeterna',
  'sermones-romani',
  'epitome-historiae-sacrae',
  'caesar-de-bello-gallico-vii',
  'sallustius-cicero-catilina',
  'plautus-amphitryo',
  'petronius-cena-trimalchionis',
  'vergil-aeneis-i-et-iv',
  'ovidii-ars-amatoria',
]
const BOOK_RANK = new Map(BOOK_ORDER.map((slug, index) => [slug, index]))
books.sort((a, b) => (BOOK_RANK.get(a.slug) ?? 99) - (BOOK_RANK.get(b.slug) ?? 99))

// Three broad stages for the shelf. The course volumes and their companions
// sit with the stage they support, so the progression from first sentences to
// the classical authors is visible without reading the descriptions.
export const levelGroups = [
  {
    id: 'beginner',
    title: 'Beginner',
    latin: 'Initium',
    description:
      'Start here: first sentences, grammar, exercises and easy reading, with the companions that explain them.',
    slugs: [
      'familia-romana',
      'exercitia-latina',
      'colloquia-personarum',
      'companion-to-familia-romana',
      'learn-latin-from-the-romans',
      'latin-via-ovid',
      'fabulae-syrae',
    ],
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    latin: 'Prōgressus',
    description:
      'Roma Aeterna and the readers that carry you from graded Latin into longer, unadapted prose.',
    slugs: [
      'roma-aeterna',
      'exercitia-latina-ii',
      'companion-to-roma-aeterna',
      'sermones-romani',
      'epitome-historiae-sacrae',
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    latin: 'Prōvectī',
    description:
      'The classical authors read in the original: history, oratory, comedy, the novel and epic.',
    slugs: [
      'caesar-de-bello-gallico-vii',
      'sallustius-cicero-catilina',
      'plautus-amphitryo',
      'petronius-cena-trimalchionis',
      'vergil-aeneis-i-et-iv',
      'ovidii-ars-amatoria',
    ],
  },
]

// A dedicated shelf for the original works. It starts empty: new original
// editions are added here by slug as they arrive, while the existing author
// editions remain in the Advanced stage. Horace and further authors can join
// this shelf in the same way.
export const authorShelf = {
  id: 'auctores-latini',
  title: 'Auctōrēs Latīnī',
  latin: 'Opera orīginālia',
  description:
    'A home for the original works of Latin literature, read in the original: Caesar and Sallust in ' +
    'history, Cicero in oratory, Plautus and Petronius for the stage and the novel, Vergil and Ovid in ' +
    'verse, and the authors still to come, such as Horace.',
  emptyLabel: 'new shelf',
  emptyNote:
    'The first original texts will appear here as they are added. The existing author editions remain ' +
    'on the Advanced shelf.',
  slugs: [],
}

// The order in which shelves are rendered on /library.
export const libraryShelves = [...levelGroups, authorShelf]

const LEVEL_BY_SLUG = new Map()
for (const group of levelGroups) {
  for (const slug of group.slugs) LEVEL_BY_SLUG.set(slug, group.id)
}
for (const book of books) {
  book.levelGroup = LEVEL_BY_SLUG.get(book.slug) || 'advanced'
}

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