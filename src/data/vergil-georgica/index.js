import { outline } from './outline.js'
import { detailed } from './georgica.js'
import { extras } from './extras.js'

// Merge the table of contents with the Latin text.
export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  id: 'vergil-georgica',
  slug: 'vergil-georgica',
  title: 'Vergil: Georgica',
  latinTitle: 'P. VERGILII MARONIS GEORGICA',
  shortTitle: 'Georgica',
  author: 'P. Vergilius Marō',
  edition: 'Digital edition after the Latin Library',
  year: 2026,
  publisher: 'The Latin Library',
  isbn: '',
  level: 'Reader — Georgics, four books',
  language: 'Latin',
  summary:
    'Vergil’s four books on farming, trees and vines, livestock, and bees, closing with the tale of Orpheus and Eurydice.',
  description:
    'The complete Georgics in the Latin Library text, one chapter for each of the four books and readings of about a hundred verses. The source does not mark vowel quantity; macra are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu.',
  accent: 'gold',
  status: 'active',
  kind: 'reader',
  unit: 'Liber',
  unitPlural: 'Libri',
  readingUnit: 'liber',
  readingUnitPlural: 'libri',
  collectionLabel: 'Libri',
  readingLabel: 'Liber',
  collectionNote:
    'The four books of the Georgics, in the Latin Library text with editorial macra.',
  startLabel: 'Start Liber I',
  sourceUnit: 'Georg.',

  chapterCount: outline.length,
  readingCount: chapters.reduce((total, chapter) => total + (chapter.readings?.length || 0), 0),
  readyCount: chapters.filter((chapter) => chapter.complete).length,
  chapters,
  extras,
}

export default book
