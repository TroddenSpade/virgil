import { outline } from './outline.js'
import { detailed } from './amores.js'
import { extras } from './extras.js'

// Merge the table of contents with the Latin text.
export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  id: "ovidius-amores",
  slug: "ovidius-amores",
  title: "Ovid: Amores",
  latinTitle: "P. OVIDII NASONIS AMORES",
  shortTitle: "Amores",
  author: 'P. Ovidius Naso',
  edition: 'Digital edition after the Latin Library',
  year: 2026,
  publisher: 'The Latin Library',
  isbn: '',
  level: "Reader — three books of elegiac poems",
  language: 'Latin',
  summary: "Ovid’s three books of love elegies are centred on Corinna and the poet’s witty servitude to Amor. The Latin text follows The Latin Library, with editorial macra throughout.",
  description: "The complete Amores in the Latin Library text, one chapter for each of the three books and one reading for each poem, including the opening epigram. The source does not mark vowel quantity; macra are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu.",
  accent: "wine",
  status: 'active',
  kind: 'reader',
  unit: 'Liber',
  unitPlural: 'Libri',
  readingUnit: 'liber',
  readingUnitPlural: 'libri',
  collectionLabel: 'Libri',
  readingLabel: 'Liber',
  collectionNote: "Three books of elegiac poems; macra are editorial and can be hidden with the Diacritics menu.",
  startLabel: "Start Liber I",
  sourceUnit: "Lib.",

  chapterCount: outline.length,
  readingCount: chapters.reduce((total, chapter) => total + (chapter.readings?.length || 0), 0),
  readyCount: chapters.filter((chapter) => chapter.complete).length,
  chapters,
  extras,
}

export default book
