import { outline } from './outline.js'
import { detailed } from './remedia-amoris.js'
import { extras } from './extras.js'

// Merge the table of contents with the Latin text.
export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  id: "ovidius-remedia-amoris",
  slug: "ovidius-remedia-amoris",
  title: "Ovid: Remedia Amoris",
  latinTitle: "P. OVIDII NASONIS REMEDIA AMORIS",
  shortTitle: "Remedia Amoris",
  author: 'P. Ovidius Naso',
  edition: 'Digital edition after the Latin Library',
  year: 2026,
  publisher: 'The Latin Library',
  isbn: '',
  level: "Reader — one book of elegiac remedies",
  language: 'Latin',
  summary: "Ovid’s single book on the cure for love is a companion to the Ars Amatoria. The Latin text follows The Latin Library, with editorial macra throughout.",
  description: "The complete Remedia Amoris in the Latin Library text, one chapter and readings of about a hundred verses. The source does not mark vowel quantity; macra are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu.",
  accent: "wine",
  status: 'active',
  kind: 'reader',
  unit: 'Liber',
  unitPlural: 'Libri',
  readingUnit: 'liber',
  readingUnitPlural: 'libri',
  collectionLabel: 'Libri',
  readingLabel: 'Liber',
  collectionNote: "One book of elegiac verse; macra are editorial and can be hidden with the Diacritics menu.",
  startLabel: "Start Remedia Amoris",
  sourceUnit: "Lib.",

  chapterCount: outline.length,
  readingCount: chapters.reduce((total, chapter) => total + (chapter.readings?.length || 0), 0),
  readyCount: chapters.filter((chapter) => chapter.complete).length,
  chapters,
  extras,
}

export default book
