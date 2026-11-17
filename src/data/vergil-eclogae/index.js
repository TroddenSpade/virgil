import { outline } from './outline.js'
import { detailed } from './eclogae.js'
import { extras } from './extras.js'

// Merge the table of contents with the Latin text.
export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  id: 'vergil-eclogae',
  slug: 'vergil-eclogae',
  title: 'Vergil: Eclogae',
  latinTitle: 'P. VERGILII MARONIS ECLOGAE',
  shortTitle: 'Eclogae',
  author: 'P. Vergilius Marō',
  edition: 'Digital edition after the Latin Library',
  year: 2026,
  publisher: 'The Latin Library',
  isbn: '',
  level: 'Reader — Eclogues, ten poems',
  language: 'Latin',
  summary:
    'The ten Eclogues of Vergil: pastoral song, love and loss, the singing contests, and the great prophecy of the fourth poem.',
  description:
    'The complete Eclogues in the Latin Library text, one chapter for each poem. The source does not mark vowel quantity; macra are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu. The speakers of the dialogue poems are kept at the head of each speech.',
  accent: 'ivory',
  status: 'active',
  kind: 'reader',
  unit: 'Ecloga',
  unitPlural: 'Eclogae',
  readingUnit: 'ecloga',
  readingUnitPlural: 'eclogae',
  collectionLabel: 'Eclogae',
  readingLabel: 'Ecloga',
  collectionNote:
    'The ten Eclogues, one reading for each poem, with the speakers of the dialogue poems marked.',
  startLabel: 'Start Ecloga I',
  sourceUnit: 'Ecl.',

  chapterCount: outline.length,
  readingCount: chapters.reduce((total, chapter) => total + (chapter.readings?.length || 0), 0),
  readyCount: chapters.filter((chapter) => chapter.complete).length,
  chapters,
  extras,
}

export default book
