import { outline } from './outline.js'
import { detailed } from './ibis.js'
import { extras } from './extras.js'

// Merge the table of contents with the Latin text.
export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  id: "ovidius-ibis",
  slug: "ovidius-ibis",
  title: "Ovid: Ibis",
  latinTitle: "P. OVIDII NASONIS IBIS",
  shortTitle: "Ibis",
  author: 'P. Ovidius Naso',
  edition: 'Digital edition after the Latin Library',
  year: 2026,
  publisher: 'The Latin Library',
  isbn: '',
  level: "Reader — one book of invective elegiacs",
  language: 'Latin',
  summary: "Ovid’s single book of invective attacks an unnamed enemy in the manner of Callimachus’ Ibis. The Latin text follows The Latin Library, with editorial macra throughout.",
  description: "The complete Ibis in the Latin Library text, one chapter and readings of about a hundred verses. The source does not mark vowel quantity; macra are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu.",
  accent: "ivory",
  status: 'active',
  kind: 'reader',
  unit: 'Liber',
  unitPlural: 'Libri',
  readingUnit: 'liber',
  readingUnitPlural: 'libri',
  collectionLabel: 'Libri',
  readingLabel: 'Liber',
  collectionNote: "One book of elegiac verse; macra are editorial and can be hidden with the Diacritics menu.",
  startLabel: "Start Ibis",
  sourceUnit: "Lib.",

  chapterCount: outline.length,
  readingCount: chapters.reduce((total, chapter) => total + (chapter.readings?.length || 0), 0),
  readyCount: chapters.filter((chapter) => chapter.complete).length,
  chapters,
  extras,
}

export default book
