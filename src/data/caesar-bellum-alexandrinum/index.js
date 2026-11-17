// Caesar: Bellum Alexandrinum — data module.
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
  "id": "caesar-bellum-alexandrinum",
  "slug": "caesar-bellum-alexandrinum",
  "title": "Caesar: Bellum Alexandrinum",
  "latinTitle": "BELLVM ALEXANDRINVM",
  "shortTitle": "Bellum Alexandrinum",
  "author": "Aulus Hirtius (attrib.)",
  "edition": "Digital edition after the Latin Library",
  "year": 2026,
  "publisher": "The Latin Library",
  "isbn": "",
  "level": "Reader — Bellum Alexandrinum",
  "language": "Latin",
  "summary": "The continuation of Caesar’s Commentarii covering the Alexandrian war of 47 BC, attributed to Aulus Hirtius: the siege of Alexandria, the fighting in the harbour and the settlement of Egypt.",
  "description": "The Bellum Alexandrinum carries Caesar’s narrative from the death of Pompey through the siege of Alexandria and the dynastic quarrel of Cleopatra and Ptolemy, down to the settlement of Egypt and the events that followed in Syria and Asia. The Latin text is reproduced from The Latin Library, one reading for each numbered section. The source prints no vowel quantities, so macra are supplied editorially with the Alatius Latin Macronizer and can be hidden with the Diacritics menu.",
  "accent": "ivory",
  "status": "active",
  "kind": "reader",
  "unit": "Caput",
  "unitPlural": "Capita",
  "readingUnit": "caput",
  "readingUnitPlural": "capita",
  "collectionLabel": "Capitula",
  "readingLabel": "Caput",
  "collectionNote": "The whole Bellum Alexandrinum, one reading for each numbered section.",
  "startLabel": "Incipit Bellum Alexandrinum",
  "sourceUnit": "Lib.",
  "chapterCount": 1,
  "readingCount": 78,
  "readyCount": 1,
  chapters: chapters,
  extras: extras
}

export default book
