import { outline } from './outline.js'
import { detailed } from './metamorphoses.js'
import { extras } from './extras.js'

// Merge the table of contents with the Latin text.
export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  id: "ovidius-metamorphoses",
  slug: "ovidius-metamorphoses",
  title: "Ovid: Metamorphoses",
  latinTitle: "P. OVIDII NASONIS METAMORPHOSES",
  shortTitle: "Metamorphoses",
  author: 'P. Ovidius Naso',
  edition: 'Digital edition after the Latin Library',
  year: 2026,
  publisher: 'The Latin Library',
  isbn: '',
  level: "Reader — fifteen books of hexameter verse",
  language: 'Latin',
  summary: "Ovid’s fifteen books of transformations run from the creation of the world to the apotheosis of Caesar. The Latin text follows The Latin Library, with editorial macra throughout.",
  description: "The complete Metamorphoses in the Latin Library text, one chapter for each of the fifteen books and readings of roughly a hundred verses. The source does not mark vowel quantity; macra are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu.",
  accent: "laurel",
  status: 'active',
  kind: 'reader',
  unit: 'Liber',
  unitPlural: 'Libri',
  readingUnit: 'liber',
  readingUnitPlural: 'libri',
  collectionLabel: 'Libri',
  readingLabel: 'Liber',
  collectionNote: "Fifteen books of hexameter verse; macra are editorial and can be hidden with the Diacritics menu.",
  startLabel: "Start Liber I",
  sourceUnit: "Lib.",

  chapterCount: outline.length,
  readingCount: chapters.reduce((total, chapter) => total + (chapter.readings?.length || 0), 0),
  readyCount: chapters.filter((chapter) => chapter.complete).length,
  chapters,
  extras,
}

export default book
