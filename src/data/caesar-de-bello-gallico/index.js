// Caesar: De Bello Gallico — data module.
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
  "id": "caesar-de-bello-gallico",
  "slug": "caesar-de-bello-gallico",
  "title": "Caesar: De Bello Gallico",
  "latinTitle": "C. IVLII CAESARIS COMMENTARII DE BELLO GALLICO",
  "shortTitle": "De Bello Gallico",
  "author": "C. Iulius Caesar",
  "edition": "Digital edition after the Latin Library",
  "year": 2026,
  "publisher": "The Latin Library",
  "isbn": "",
  "level": "Reader — De Bello Gallico, Books I–VIII",
  "language": "Latin",
  "summary": "Caesar’s seven commentaries on his campaigns in Gaul, followed by the eighth book of Aulus Hirtius: the Helvetii and Ariovistus, the Belgic and Armorican wars, the crossings to Britain and across the Rhine, and the revolt of Vercingetorix down to Alesia.",
  "description": "The De Bello Gallico is Caesar’s own account of the conquest of Gaul from 58 to 52 BC, continued by Aulus Hirtius for 51–50 BC. This digital edition reproduces the complete Latin text of the eight books from The Latin Library, one chapter for each book and one reading for each numbered section, with Hirtius’s preface to Book VIII. The source prints no vowel quantities, so macra are supplied editorially with the Alatius Latin Macronizer and can be hidden with the Diacritics menu.",
  "accent": "laurel",
  "status": "active",
  "kind": "reader",
  "unit": "Liber",
  "unitPlural": "Libri",
  "readingUnit": "liber",
  "readingUnitPlural": "libri",
  "collectionLabel": "Libri",
  "readingLabel": "Liber",
  "collectionNote": "The eight books of the Gallic War, one reading for each numbered section, with the preface of Hirtius to Book VIII.",
  "startLabel": "Incipit Liber I",
  "sourceUnit": "Lib.",
  "chapterCount": 8,
  "readingCount": 404,
  "readyCount": 8,
  chapters: chapters,
  extras: extras
}

export default book
