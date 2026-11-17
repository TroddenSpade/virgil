import { outline } from './outline.js'
import { detailed } from './ars-amatoria.js'
import { extras } from './extras.js'

// Merge the table of contents with the Latin text.
export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  id: "ovidius-ars-amatoria",
  slug: "ovidius-ars-amatoria",
  title: "Ovid: Ars Amatoria",
  latinTitle: "P. OVIDII NASONIS ARS AMATORIA",
  shortTitle: "Ars Amatoria",
  author: 'P. Ovidius Naso',
  edition: 'Digital edition after the Latin Library',
  year: 2026,
  publisher: 'The Latin Library',
  isbn: '',
  level: "Reader — three books on the art of love",
  language: 'Latin',
  summary: "Ovid’s mock-didactic poem teaches how to find, win, and keep love in three books of elegiac couplets. The Latin text follows The Latin Library, with editorial macra throughout.",
  description: "The complete Ars Amatoria in the Latin Library text, one chapter for each of the three books and readings of about a hundred verses. The source does not mark vowel quantity; macra are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu.",
  accent: "gold",
  status: 'active',
  kind: 'reader',
  unit: 'Liber',
  unitPlural: 'Libri',
  readingUnit: 'liber',
  readingUnitPlural: 'libri',
  collectionLabel: 'Libri',
  readingLabel: 'Liber',
  collectionNote: "Three books of elegiac verse; macra are editorial and can be hidden with the Diacritics menu.",
  startLabel: "Start Liber I",
  sourceUnit: "Lib.",

  chapterCount: outline.length,
  readingCount: chapters.reduce((total, chapter) => total + (chapter.readings?.length || 0), 0),
  readyCount: chapters.filter((chapter) => chapter.complete).length,
  chapters,
  extras,
}

export default book
