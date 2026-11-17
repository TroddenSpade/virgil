import { outline } from './outline.js'
import { detailed } from './epistulae.js'
import { extras } from './extras.js'

// One chapter per letter, in the order of the sixteen books.
export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  id: 'cicero-epistulae-ad-familiares',
  slug: 'cicero-epistulae-ad-familiares',
  title: 'Cicero: Epistulae ad Familiares',
  latinTitle: 'M. TVLLI CICERONIS EPISTVLAE AD FAMILIARES',
  shortTitle: 'Ad Familiares',
  author: 'Marcus Tullius Cicero',
  edition: 'Digital edition after the Latin Library',
  year: 2026,
  publisher: 'The Latin Library',
  isbn: '',
  level: 'Reader — 427 letters',
  language: 'Latin',
  summary:
    'Cicero’s surviving letters to friends, family and political allies, arranged in the sixteen books ' +
    'of the collection: public crises and private grief, advice, consolation, invective and the daily ' +
    'business of the late Republic.',
  description:
    'The Epistulae ad Familiares collect Cicero’s correspondence with Pompey, his brother Quintus, ' +
    'Terentia and Tiro, and the generals and governors of the late Republic. The Latin ' +
    'text follows the electronic edition at The Latin Library and is arranged by book and letter. The ' +
    'source prints no vowel quantities, so macra are supplied editorially with the Alatius Latin ' +
    'Macronizer and can be hidden with the Diacritics menu.',
  accent: 'gold',
  status: 'active',
  kind: 'reader',
  unit: 'Epistula',
  unitPlural: 'Epistulae',
  readingUnit: 'epistula',
  readingUnitPlural: 'epistulae',
  collectionLabel: 'Epistulae',
  readingLabel: 'Epistula',
  collectionNote:
    'The complete surviving correspondence to friends and family, with one reading for each letter and ' +
    'the printed book and letter numbering preserved.',
  startLabel: 'Start Epistula I.1',
  sourceUnit: 'Ep.',
  chapterCount: outline.length,
  readingCount: chapters.reduce((total, chapter) => total + (chapter.readings?.length || 0), 0),
  readyCount: chapters.filter((chapter) => chapter.complete).length,
  chapters,
  extras,
}

export default book
