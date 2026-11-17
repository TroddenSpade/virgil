import { outline } from './outline.js'
import { detailed } from './carmina.js'
import { extras } from './extras.js'

// Merge the table of contents with the Latin text. Every listed poem is
// present; the fragments are kept together as the final chapter.
export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  id: 'catullus-carmina',
  slug: 'catullus-carmina',
  title: 'Catullus: Carmina',
  latinTitle: 'C. VALERII CATVLLI CARMINA',
  shortTitle: 'Catullus',
  author: 'Gaius Valerius Catullus',
  edition: 'R. A. B. Mynors (ed.), Oxford Classical Texts',
  year: 1958,
  publisher: 'Oxford University Press',
  isbn: '9780198146049',
  level: 'Reader — complete Carmina',
  language: 'Latin',
  summary:
    'The complete poems of Catullus: love and invective, friendship and grief, the marriage hymns, ' +
    'the Attis and the epyllion on the wedding of Peleus and Thetis, with the surviving fragments.',
  description:
    'Gaius Valerius Catullus (c. 84–54 BC) is the most personal of the Roman poets: the Lesbia poems, ' +
    'the abusive iambics, the marriage songs and the long mythological pieces are all here in the original ' +
    'Latin. The text follows the Latin Library electronic text and has been checked against the Oxford ' +
    'Classical Texts edition of R. A. B. Mynors (Oxford, 1958). The source does not mark vowel quantity, ' +
    'so macra are supplied editorially with the Alatius Latin Macronizer and can be hidden with the ' +
    'Diacritics menu; the surviving fragments are printed after Carmen CXVI.',
  accent: 'wine',
  status: 'active',
  kind: 'reader',
  unit: 'Carmen',
  unitPlural: 'Carmina',
  readingUnit: 'carmen',
  readingUnitPlural: 'carmina',
  collectionLabel: 'Carmina',
  readingLabel: 'Carmen',
  collectionNote:
    'The complete Carmina, including the fragments, with one reading for each poem and the printed ' +
    'stanza breaks preserved.',
  startLabel: 'Start Carmen I',
  sourceUnit: 'Carm.',
  chapterCount: outline.length,
  readingCount: chapters.reduce((total, chapter) => total + (chapter.readings?.length || 0), 0),
  readyCount: chapters.filter((chapter) => chapter.complete).length,
  chapters,
  extras,
}

export default book
