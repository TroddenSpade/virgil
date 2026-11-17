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
import { book as catullus, chapters as catullusChapters } from './catullus-carmina/index.js'
import { book as ciceroFamiliares, chapters as ciceroFamiliaresChapters } from './cicero-epistulae-ad-familiares/index.js'
import { book as caesarGallico, chapters as caesarGallicoChapters } from './caesar-de-bello-gallico/index.js'
import { book as caesarCivili, chapters as caesarCiviliChapters } from './caesar-de-bello-civili/index.js'
import { book as caesarAlexandrinum, chapters as caesarAlexandrinumChapters } from './caesar-bellum-alexandrinum/index.js'
import { book as caesarAfricum, chapters as caesarAfricumChapters } from './caesar-bellum-africum/index.js'
import { book as caesarHispaniense, chapters as caesarHispanienseChapters } from './caesar-bellum-hispaniense/index.js'
import { book as ovidMetamorphoses, chapters as ovidMetamorphosesChapters } from './ovidius-metamorphoses/index.js'
import { book as ovidAmores, chapters as ovidAmoresChapters } from './ovidius-amores/index.js'
import { book as ovidHeroides, chapters as ovidHeroidesChapters } from './ovidius-heroides/index.js'
import { book as ovidArsAmatoria, chapters as ovidArsAmatoriaChapters } from './ovidius-ars-amatoria/index.js'
import { book as ovidTristia, chapters as ovidTristiaChapters } from './ovidius-tristia/index.js'
import { book as ovidExPonto, chapters as ovidExPontoChapters } from './ovidius-ex-ponto/index.js'
import { book as ovidFasti, chapters as ovidFastiChapters } from './ovidius-fasti/index.js'
import { book as ovidRemedia, chapters as ovidRemediaChapters } from './ovidius-remedia-amoris/index.js'
import { book as ovidIbis, chapters as ovidIbisChapters } from './ovidius-ibis/index.js'
import { book as vergilAeneis, chapters as vergilAeneisChapters } from './vergil-aeneis/index.js'
import { book as vergilEclogae, chapters as vergilEclogaeChapters } from './vergil-eclogae/index.js'
import { book as vergilGeorgica, chapters as vergilGeorgicaChapters } from './vergil-georgica/index.js'
import { book as horaceSermones, chapters as horaceSermonesChapters } from './horatius-sermones/index.js'
import { book as horaceCarmina, chapters as horaceCarminaChapters } from './horatius-carmina/index.js'
import { book as horaceEpistulae, chapters as horaceEpistulaeChapters } from './horatius-epistulae/index.js'
import { book as horaceArsPoetica, chapters as horaceArsPoeticaChapters } from './horatius-ars-poetica/index.js'
import { book as horaceCarmenSaeculare, chapters as horaceCarmenSaeculareChapters } from './horatius-carmen-saeculare/index.js'
import { book as horaceEpodi, chapters as horaceEpodiChapters } from './horatius-epodi/index.js'
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

export const catullusBook = {
  ...catullus,
  chapters: catullusChapters,
}

export const ciceroFamiliaresBook = {
  ...ciceroFamiliares,
  chapters: ciceroFamiliaresChapters,
}

export const caesarGallicoBook = {
  ...caesarGallico,
  chapters: caesarGallicoChapters,
}
export const caesarCiviliBook = {
  ...caesarCivili,
  chapters: caesarCiviliChapters,
}
export const caesarAlexandrinumBook = {
  ...caesarAlexandrinum,
  chapters: caesarAlexandrinumChapters,
}
export const caesarAfricumBook = {
  ...caesarAfricum,
  chapters: caesarAfricumChapters,
}
export const caesarHispanienseBook = {
  ...caesarHispaniense,
  chapters: caesarHispanienseChapters,
}
export const ovidMetamorphosesBook = {
  ...ovidMetamorphoses,
  chapters: ovidMetamorphosesChapters,
}
export const ovidAmoresBook = {
  ...ovidAmores,
  chapters: ovidAmoresChapters,
}
export const ovidHeroidesBook = {
  ...ovidHeroides,
  chapters: ovidHeroidesChapters,
}
export const ovidArsAmatoriaBook = {
  ...ovidArsAmatoria,
  chapters: ovidArsAmatoriaChapters,
}
export const ovidTristiaBook = {
  ...ovidTristia,
  chapters: ovidTristiaChapters,
}
export const ovidExPontoBook = {
  ...ovidExPonto,
  chapters: ovidExPontoChapters,
}
export const ovidFastiBook = {
  ...ovidFasti,
  chapters: ovidFastiChapters,
}
export const ovidRemediaBook = {
  ...ovidRemedia,
  chapters: ovidRemediaChapters,
}
export const ovidIbisBook = {
  ...ovidIbis,
  chapters: ovidIbisChapters,
}
export const vergilAeneisBook = {
  ...vergilAeneis,
  chapters: vergilAeneisChapters,
}
export const vergilEclogaeBook = {
  ...vergilEclogae,
  chapters: vergilEclogaeChapters,
}
export const vergilGeorgicaBook = {
  ...vergilGeorgica,
  chapters: vergilGeorgicaChapters,
}
export const horaceSermonesBook = {
  ...horaceSermones,
  chapters: horaceSermonesChapters,
}
export const horaceCarminaBook = {
  ...horaceCarmina,
  chapters: horaceCarminaChapters,
}
export const horaceEpistulaeBook = {
  ...horaceEpistulae,
  chapters: horaceEpistulaeChapters,
}
export const horaceArsPoeticaBook = {
  ...horaceArsPoetica,
  chapters: horaceArsPoeticaChapters,
}
export const horaceCarmenSaeculareBook = {
  ...horaceCarmenSaeculare,
  chapters: horaceCarmenSaeculareChapters,
}
export const horaceEpodiBook = {
  ...horaceEpodi,
  chapters: horaceEpodiChapters,
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
  catullusBook,
  ciceroFamiliaresBook,
  caesarGallicoBook,
  caesarCiviliBook,
  caesarAlexandrinumBook,
  caesarAfricumBook,
  caesarHispanienseBook,
  ovidMetamorphosesBook,
  ovidAmoresBook,
  ovidHeroidesBook,
  ovidArsAmatoriaBook,
  ovidTristiaBook,
  ovidExPontoBook,
  ovidFastiBook,
  ovidRemediaBook,
  ovidIbisBook,
  vergilAeneisBook,
  vergilEclogaeBook,
  vergilGeorgicaBook,
  horaceSermonesBook,
  horaceCarminaBook,
  horaceEpistulaeBook,
  horaceArsPoeticaBook,
  horaceCarmenSaeculareBook,
  horaceEpodiBook,
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
  'caesar-de-bello-gallico',
  'caesar-de-bello-civili',
  'caesar-bellum-alexandrinum',
  'caesar-bellum-africum',
  'caesar-bellum-hispaniense',
  'cicero-epistulae-ad-familiares',
  'catullus-carmina',
  'vergil-aeneis',
  'vergil-eclogae',
  'vergil-georgica',
  'horatius-sermones',
  'horatius-carmina',
  'horatius-epistulae',
  'horatius-ars-poetica',
  'horatius-carmen-saeculare',
  'horatius-epodi',
  'ovidius-metamorphoses',
  'ovidius-amores',
  'ovidius-heroides',
  'ovidius-ars-amatoria',
  'ovidius-fasti',
  'ovidius-tristia',
  'ovidius-ex-ponto',
  'ovidius-remedia-amoris',
  'ovidius-ibis',
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

// The dedicated shelf for the complete original works. These editions are a
// reading collection of their own and are deliberately left off the Iter; the
// existing school editions remain in the Advanced stage and on the road.
// Complete editions are added here by slug and filtered by author on the page.
export const authorShelf = {
  id: 'latinae-periti',
  modifier: 'library-level--collection',
  title: 'Latīnistae',
  latin: 'Opera orīginālia',
  description:
    'A shelf for Latinists — readers at home in the original language: Caesar in history and letters, ' +
    'Cicero in oratory and letters, Catullus, Vergil, Horace and Ovid in verse, and further authors as ' +
    'their texts are added.',
  emptyLabel: 'new shelf',
  emptyNote:
    'The first original texts will appear here as they are added. The existing author editions remain ' +
    'on the Advanced shelf.',
  slugs: [
    'caesar-de-bello-gallico',
    'caesar-de-bello-civili',
    'caesar-bellum-alexandrinum',
    'caesar-bellum-africum',
    'caesar-bellum-hispaniense',
    'cicero-epistulae-ad-familiares',
    'catullus-carmina',
    'vergil-aeneis',
    'vergil-eclogae',
    'vergil-georgica',
    'horatius-sermones',
    'horatius-carmina',
    'horatius-epistulae',
    'horatius-ars-poetica',
    'horatius-carmen-saeculare',
    'horatius-epodi',
    'ovidius-metamorphoses',
    'ovidius-amores',
    'ovidius-heroides',
    'ovidius-ars-amatoria',
    'ovidius-fasti',
    'ovidius-tristia',
    'ovidius-ex-ponto',
    'ovidius-remedia-amoris',
    'ovidius-ibis',
  ],
}

// The order in which shelves are rendered on /library.
export const libraryShelves = [...levelGroups, authorShelf]

// Original-language editions get the diacritics menu in their reading
// toolbar. This includes the new authors shelf and the existing Advanced
// author editions, whose texts carry printed macra.
const AUTHOR_SHELF_SLUGS = new Set(authorShelf.slugs)
const ORIGINAL_EDITIONS = new Set([
  ...authorShelf.slugs,
  ...(levelGroups.find((group) => group.id === 'advanced')?.slugs || []),
])

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
  'catullus-carmina': 'CATVLLVS',
  'cicero-epistulae-ad-familiares': 'CICERO',
  'caesar-de-bello-gallico': 'BELL. GALL.',
  'caesar-de-bello-civili': 'BELL. CIV.',
  'caesar-bellum-alexandrinum': 'ALEX.',
  'caesar-bellum-africum': 'AFR.',
  'caesar-bellum-hispaniense': 'HISP.',
  'vergil-aeneis': 'AENEIS',
  'vergil-eclogae': 'ECLOGAE',
  'vergil-georgica': 'GEORG.',
  'horatius-sermones': 'SERM.',
  'horatius-carmina': 'CARM.',
  'horatius-epistulae': 'EPIST.',
  'horatius-ars-poetica': 'ARS POET.',
  'horatius-carmen-saeculare': 'CARM. SAEC.',
  'horatius-epodi': 'EPODI',
  'ovidius-metamorphoses': 'METAM.',
  'ovidius-amores': 'AMORES',
  'ovidius-heroides': 'HEROIDES',
  'ovidius-ars-amatoria': 'ARS AM.',
  'ovidius-fasti': 'FASTI',
  'ovidius-tristia': 'TRISTIA',
  'ovidius-ex-ponto': 'EX PONTO',
  'ovidius-remedia-amoris': 'REMEDIA',
  'ovidius-ibis': 'IBIS',
  'companion-roma-aeterna': 'COMES II',
  companion: 'COMES I',
  'learn-latin': 'DISC. LAT.',
  'latin-via-ovid': 'LAT. OVID.',
}

for (const book of books) {
  book.heroMark = HERO_MARKS[book.id] || book.shortTitle?.toUpperCase() || 'LIBER'
  book.isAuthorShelf = AUTHOR_SHELF_SLUGS.has(book.slug)
  book.isOriginalEdition = ORIGINAL_EDITIONS.has(book.slug)
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