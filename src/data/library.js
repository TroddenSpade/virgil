// The library registry.
//
// This module is deliberately light: it reads the generated book metadata and
// never imports a book's full text. Pages that need chapter content load one
// book on demand through src/data/book-loader.js, so Home, Library and Iter
// stay small.
import { booksMeta } from './books-meta.generated.js'
import { sources } from './sources.generated.js'

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

export const books = booksMeta.map((book) => ({
  ...book,
  ...(book.sourceSlug
    ? { referenceChapters: referenceChapters(book.sourceSlug) }
    : {}),
}))

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

const bySlug = new Map(books.map((book) => [book.slug, book]))

// Named accessors kept for the pages and helpers that use a familiar book.
export const familiaRomanaBook = bySlug.get('familia-romana')
export const romaAeternaBook = bySlug.get('roma-aeterna')
export const exercitiaBook = bySlug.get('exercitia-latina')
export const latinViaOvidBook = bySlug.get('latin-via-ovid')
export const companionBook = bySlug.get('companion-to-familia-romana')
export const colloquiaBook = bySlug.get('colloquia-personarum')
export const fabulaeBook = bySlug.get('fabulae-syrae')
export const learnLatinBook = bySlug.get('learn-latin-from-the-romans')
export const epitomeBook = bySlug.get('epitome-historiae-sacrae')
export const caesarBook = bySlug.get('caesar-de-bello-gallico-vii')
export const exercitiaIIBook = bySlug.get('exercitia-latina-ii')
export const sermonesBook = bySlug.get('sermones-romani')
export const petroniusBook = bySlug.get('petronius-cena-trimalchionis')
export const arsBook = bySlug.get('ovidii-ars-amatoria')
export const companionRABook = bySlug.get('companion-to-roma-aeterna')
export const aeneisBook = bySlug.get('vergil-aeneis-i-et-iv')
export const catilinaBook = bySlug.get('sallustius-cicero-catilina')
export const amphitryoBook = bySlug.get('plautus-amphitryo')
export const catullusBook = bySlug.get('catullus-carmina')
export const ciceroFamiliaresBook = bySlug.get('cicero-epistulae-ad-familiares')
export const caesarGallicoBook = bySlug.get('caesar-de-bello-gallico')
export const caesarCiviliBook = bySlug.get('caesar-de-bello-civili')
export const caesarAlexandrinumBook = bySlug.get('caesar-bellum-alexandrinum')
export const caesarAfricumBook = bySlug.get('caesar-bellum-africum')
export const caesarHispanienseBook = bySlug.get('caesar-bellum-hispaniense')
export const ovidMetamorphosesBook = bySlug.get('ovidius-metamorphoses')
export const ovidAmoresBook = bySlug.get('ovidius-amores')
export const ovidHeroidesBook = bySlug.get('ovidius-heroides')
export const ovidArsAmatoriaBook = bySlug.get('ovidius-ars-amatoria')
export const ovidTristiaBook = bySlug.get('ovidius-tristia')
export const ovidExPontoBook = bySlug.get('ovidius-ex-ponto')
export const ovidFastiBook = bySlug.get('ovidius-fasti')
export const ovidRemediaBook = bySlug.get('ovidius-remedia-amoris')
export const ovidIbisBook = bySlug.get('ovidius-ibis')
export const vergilAeneisBook = bySlug.get('vergil-aeneis')
export const vergilEclogaeBook = bySlug.get('vergil-eclogae')
export const vergilGeorgicaBook = bySlug.get('vergil-georgica')
export const horaceSermonesBook = bySlug.get('horatius-sermones')
export const horaceCarminaBook = bySlug.get('horatius-carmina')
export const horaceEpistulaeBook = bySlug.get('horatius-epistulae')
export const horaceArsPoeticaBook = bySlug.get('horatius-ars-poetica')
export const horaceCarmenSaeculareBook = bySlug.get('horatius-carmen-saeculare')
export const horaceEpodiBook = bySlug.get('horatius-epodi')

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
}

export function getBook(slug) {
  return books.find((b) => b.slug === slug)
}

export function getSource(slug) {
  return sourceBySlug[slug]
}
