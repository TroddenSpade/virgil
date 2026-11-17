// Caesar: De Bello Civili — data module.
import { outline } from './outline.js'
import { detailed } from './textus.js'
import { extras } from './extras.js'

export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  "id": "caesar-de-bello-civili",
  "slug": "caesar-de-bello-civili",
  "title": "Caesar: De Bello Civili",
  "latinTitle": "C. IVLII CAESARIS COMMENTARII DE BELLO CIVILI",
  "shortTitle": "De Bello Civili",
  "author": "C. Iulius Caesar",
  "edition": "Digital edition after the Latin Library",
  "year": 2026,
  "publisher": "The Latin Library",
  "isbn": "",
  "level": "Reader — De Bello Civili, Books I–III",
  "language": "Latin",
  "summary": "Caesar’s account of the civil war against Pompey and the Senate, from the crossing of the Rubicon and the fall of Massilia to the campaign in Spain, the fighting at Dyrrachium and the battle of Pharsalus.",
  "description": "The De Bello Civili follows the war between Caesar and Pompey in 49–48 BC: the opening negotiations, the march on Rome, the siege of Massilia, the Spanish campaign, the stand at Dyrrachium and the decisive battle at Pharsalus. The Latin text is reproduced from The Latin Library in three books, one chapter for each book and one reading for each numbered section. The source prints no vowel quantities, so macra are supplied editorially with the Alatius Latin Macronizer and can be hidden with the Diacritics menu.",
  "accent": "gold",
  "status": "active",
  "kind": "reader",
  "unit": "Liber",
  "unitPlural": "Libri",
  "readingUnit": "liber",
  "readingUnitPlural": "libri",
  "collectionLabel": "Libri",
  "readingLabel": "Liber",
  "collectionNote": "The three books of the Civil War, one reading for each numbered section.",
  "startLabel": "Incipit Liber I",
  "sourceUnit": "Lib.",
  "chapterCount": 3,
  "readingCount": 243,
  "readyCount": 3,
  chapters: chapters,
  extras: extras
}

export default book
