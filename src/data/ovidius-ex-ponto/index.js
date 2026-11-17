import { outline } from './outline.js'
import { detailed } from './ex-ponto.js'
import { extras } from './extras.js'

// Merge the table of contents with the Latin text.
export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  id: "ovidius-ex-ponto",
  slug: "ovidius-ex-ponto",
  title: "Ovid: Epistulae ex Ponto",
  latinTitle: "P. OVIDII NASONIS EPISTVLAE EX PONTO",
  shortTitle: "Ex Ponto",
  author: 'P. Ovidius Naso',
  edition: 'Digital edition after the Latin Library',
  year: 2026,
  publisher: 'The Latin Library',
  isbn: '',
  level: "Reader — four books of letters from Pontus",
  language: 'Latin',
  summary: "Four books of verse letters sent from exile on the Black Sea address friends, patrons, and family. The Latin text follows The Latin Library, with editorial macra throughout.",
  description: "The complete Epistulae ex Ponto in the Latin Library text, one chapter for each of the four books and one reading for each letter. The source does not mark vowel quantity; macra are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu.",
  accent: "ivory",
  status: 'active',
  kind: 'reader',
  unit: 'Liber',
  unitPlural: 'Libri',
  readingUnit: 'liber',
  readingUnitPlural: 'libri',
  collectionLabel: 'Libri',
  readingLabel: 'Liber',
  collectionNote: "Four books of verse letters; macra are editorial and can be hidden with the Diacritics menu.",
  startLabel: "Start Liber I",
  sourceUnit: "Lib.",

  chapterCount: outline.length,
  readingCount: chapters.reduce((total, chapter) => total + (chapter.readings?.length || 0), 0),
  readyCount: chapters.filter((chapter) => chapter.complete).length,
  chapters,
  extras,
}

export default book
