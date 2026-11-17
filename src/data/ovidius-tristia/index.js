import { outline } from './outline.js'
import { detailed } from './tristia.js'
import { extras } from './extras.js'

// Merge the table of contents with the Latin text.
export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  id: "ovidius-tristia",
  slug: "ovidius-tristia",
  title: "Ovid: Tristia",
  latinTitle: "P. OVIDII NASONIS TRISTIA",
  shortTitle: "Tristia",
  author: 'P. Ovidius Naso',
  edition: 'Digital edition after the Latin Library',
  year: 2026,
  publisher: 'The Latin Library',
  isbn: '',
  level: "Reader — five books of exile poetry",
  language: 'Latin',
  summary: "Five books of poems written from exile at Tomis move from the last night in Rome to prayers for relief. The Latin text follows The Latin Library, with editorial macra throughout.",
  description: "The complete Tristia in the Latin Library text, one chapter for each of the five books and one reading for each poem. The source does not mark vowel quantity; macra are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu.",
  accent: "ivory",
  status: 'active',
  kind: 'reader',
  unit: 'Liber',
  unitPlural: 'Libri',
  readingUnit: 'liber',
  readingUnitPlural: 'libri',
  collectionLabel: 'Libri',
  readingLabel: 'Liber',
  collectionNote: "Five books of elegiac poems; macra are editorial and can be hidden with the Diacritics menu.",
  startLabel: "Start Liber I",
  sourceUnit: "Lib.",

  chapterCount: outline.length,
  readingCount: chapters.reduce((total, chapter) => total + (chapter.readings?.length || 0), 0),
  readyCount: chapters.filter((chapter) => chapter.complete).length,
  chapters,
  extras,
}

export default book
