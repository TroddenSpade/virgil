// Caesar: Bellum Africum — data module.
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
  "id": "caesar-bellum-africum",
  "slug": "caesar-bellum-africum",
  "title": "Caesar: Bellum Africum",
  "latinTitle": "BELLVM AFRICVM",
  "shortTitle": "Bellum Africum",
  "author": "Anonymous (attrib. Caesar)",
  "edition": "Digital edition after the Latin Library",
  "year": 2026,
  "publisher": "The Latin Library",
  "isbn": "",
  "level": "Reader — Bellum Africum",
  "language": "Latin",
  "summary": "The anonymous continuation of Caesar’s Commentarii on the African campaign of 46 BC: Thapsus, the defeat of Scipio and Juba, and the last resistance of the Pompeians.",
  "description": "The Bellum Africum describes Caesar’s campaign in Africa against the Pompeian commanders Scipio and Cato and their ally Juba of Numidia, ending with the battle of Thapsus and the surrender of Utica. The Latin text is reproduced from The Latin Library, one reading for each numbered section present in the source; section 14 is missing from the transcription. The source prints no vowel quantities, so macra are supplied editorially with the Alatius Latin Macronizer and can be hidden with the Diacritics menu.",
  "accent": "ivory",
  "status": "active",
  "kind": "reader",
  "unit": "Caput",
  "unitPlural": "Capita",
  "readingUnit": "caput",
  "readingUnitPlural": "capita",
  "collectionLabel": "Capitula",
  "readingLabel": "Caput",
  "collectionNote": "The whole Bellum Africum, one reading for each numbered section; section 14 is absent from the source.",
  "startLabel": "Incipit Bellum Africum",
  "sourceUnit": "Lib.",
  "chapterCount": 1,
  "readingCount": 97,
  "readyCount": 1,
  chapters: chapters,
  extras: extras
}

export default book
