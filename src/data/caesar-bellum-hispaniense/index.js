// Caesar: Bellum Hispaniense — data module.
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
  "id": "caesar-bellum-hispaniense",
  "slug": "caesar-bellum-hispaniense",
  "title": "Caesar: Bellum Hispaniense",
  "latinTitle": "BELLVM HISPANIENSE",
  "shortTitle": "Bellum Hispaniense",
  "author": "Anonymous (attrib. Caesar)",
  "edition": "Digital edition after the Latin Library",
  "year": 2026,
  "publisher": "The Latin Library",
  "isbn": "",
  "level": "Reader — Bellum Hispaniense",
  "language": "Latin",
  "summary": "The anonymous continuation of Caesar’s Commentarii on the final campaign in Spain in 45 BC, ending with the battle of Munda.",
  "description": "The Bellum Hispaniense narrates Caesar’s last campaign against the sons of Pompey in southern Spain, from the operations around Corduba and Ategua to the hard-fought battle of Munda. The Latin text is reproduced from The Latin Library, one reading for each numbered section. The source prints no vowel quantities, so macra are supplied editorially with the Alatius Latin Macronizer and can be hidden with the Diacritics menu.",
  "accent": "ivory",
  "status": "active",
  "kind": "reader",
  "unit": "Caput",
  "unitPlural": "Capita",
  "readingUnit": "caput",
  "readingUnitPlural": "capita",
  "collectionLabel": "Capitula",
  "readingLabel": "Caput",
  "collectionNote": "The whole Bellum Hispaniense, one reading for each numbered section.",
  "startLabel": "Incipit Bellum Hispaniense",
  "sourceUnit": "Lib.",
  "chapterCount": 1,
  "readingCount": 42,
  "readyCount": 1,
  chapters: chapters,
  extras: extras
}

export default book
