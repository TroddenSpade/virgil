import { outline } from './outline.js'
import { detailed } from './heroides.js'
import { extras } from './extras.js'

// Merge the table of contents with the Latin text.
export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  id: "ovidius-heroides",
  slug: "ovidius-heroides",
  title: "Ovid: Heroides",
  latinTitle: "P. OVIDII NASONIS HEROIDES",
  shortTitle: "Heroides",
  author: 'P. Ovidius Naso',
  edition: 'Digital edition after the Latin Library',
  year: 2026,
  publisher: 'The Latin Library',
  isbn: '',
  level: "Reader — twenty-one letters in elegiac verse",
  language: 'Latin',
  summary: "Twenty-one verse letters let heroines and heroes of myth write to their absent lovers. The Latin text follows The Latin Library, with editorial macra throughout.",
  description: "The complete Heroides in the Latin Library text, one chapter and one reading for each of the twenty-one letters. The source does not mark vowel quantity; macra are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu.",
  accent: "ivory",
  status: 'active',
  kind: 'reader',
  unit: 'Epistula',
  unitPlural: 'Epistulae',
  readingUnit: 'epistula',
  readingUnitPlural: 'epistulae',
  collectionLabel: 'Epistulae',
  readingLabel: 'Epistula',
  collectionNote: "Twenty-one elegiac letters; macra are editorial and can be hidden with the Diacritics menu.",
  startLabel: "Start Epistula I",
  sourceUnit: "Ep.",

  chapterCount: outline.length,
  readingCount: chapters.reduce((total, chapter) => total + (chapter.readings?.length || 0), 0),
  readyCount: chapters.filter((chapter) => chapter.complete).length,
  chapters,
  extras,
}

export default book
