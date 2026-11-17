import { outline } from './outline.js'
import { detailed } from './aeneis.js'
import { extras } from './extras.js'

// Merge the table of contents with the Latin text.
export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  id: 'vergil-aeneis',
  slug: 'vergil-aeneis',
  title: 'Vergil: Aeneis',
  latinTitle: 'P. VERGILII MARONIS AENEIS',
  shortTitle: 'Aeneis',
  author: 'P. Vergilius Marō',
  edition: 'Digital edition after the Latin Library',
  year: 2026,
  publisher: 'The Latin Library',
  isbn: '',
  level: 'Reader — Aeneid, twelve books',
  language: 'Latin',
  summary:
    'Vergil’s Aeneid in twelve books: Aeneas’ flight from Troy, his wanderings, and the war in Latium that leads to the founding of Rome.',
  description:
    'The Aeneid in the Latin Library text, one chapter for each of the twelve books and readings of about a hundred verses. The source prints almost no vowel quantity; macra are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu. Book I keeps the macra that the electronic text does print, and all other books have been marked editorially.',
  accent: 'laurel',
  status: 'active',
  kind: 'reader',
  unit: 'Liber',
  unitPlural: 'Libri',
  readingUnit: 'liber',
  readingUnitPlural: 'libri',
  collectionLabel: 'Libri',
  readingLabel: 'Liber',
  collectionNote:
    'The twelve books of the Aeneid, in the Latin Library text with editorial macra.',
  startLabel: 'Start Liber I',
  sourceUnit: 'Aen.',

  chapterCount: outline.length,
  readingCount: chapters.reduce((total, chapter) => total + (chapter.readings?.length || 0), 0),
  readyCount: chapters.filter((chapter) => chapter.complete).length,
  chapters,
  extras,
}

export default book
