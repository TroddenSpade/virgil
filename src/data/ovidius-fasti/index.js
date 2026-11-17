import { outline } from './outline.js'
import { detailed } from './fasti.js'
import { extras } from './extras.js'

// Merge the table of contents with the Latin text.
export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  id: "ovidius-fasti",
  slug: "ovidius-fasti",
  title: "Ovid: Fasti",
  latinTitle: "P. OVIDII NASONIS FASTI",
  shortTitle: "Fasti",
  author: 'P. Ovidius Naso',
  edition: 'Digital edition after the Latin Library',
  year: 2026,
  publisher: 'The Latin Library',
  isbn: '',
  level: "Reader — six books of the Roman calendar",
  language: 'Latin',
  summary: "Six books on the Roman calendar explain the festivals of the year and the myths behind them. The Latin text follows The Latin Library, with editorial macra throughout.",
  description: "The Fasti as printed at The Latin Library, one chapter for each of the six books and one reading for each calendrical section. The source text of Book VI ends during the section for 11 June. The source does not mark vowel quantity; macra are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu.",
  accent: "gold",
  status: 'active',
  kind: 'reader',
  unit: 'Liber',
  unitPlural: 'Libri',
  readingUnit: 'liber',
  readingUnitPlural: 'libri',
  collectionLabel: 'Libri',
  readingLabel: 'Liber',
  collectionNote: "Six books of elegiac verse on the Roman year; macra are editorial and can be hidden with the Diacritics menu.",
  startLabel: "Start Liber I",
  sourceUnit: "Lib.",

  chapterCount: outline.length,
  readingCount: chapters.reduce((total, chapter) => total + (chapter.readings?.length || 0), 0),
  readyCount: chapters.filter((chapter) => chapter.complete).length,
  chapters,
  extras,
}

export default book
