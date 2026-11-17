// Horace: Epistulae — Latin text after the Latin Library electronic edition.
// Macra are editorial: the source prints none, and they were supplied with the
// Alatius Latin Macronizer. The Diacritics menu can hide them.

import { outline } from './outline.js'
import { detailed } from './epistulae.js'
import { extras } from './extras.js'

export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  "id": "horatius-epistulae",
  "slug": "horatius-epistulae",
  "title": "Horace: Epistulae",
  "latinTitle": "Q. HORATII FLACCI EPISTVLAE",
  "shortTitle": "Epistulae",
  "author": "Q. Horātius Flaccus",
  "edition": "Digital edition after the Latin Library",
  "year": 2026,
  "publisher": "The Latin Library",
  "isbn": "",
  "level": "Reader — Epistulae",
  "language": "Latin",
  "summary": "The two books of Horace’s Epistulae in the Latin Library text: twenty-two verse letters on philosophy, friendship, poetry, and country life.",
  "description": "The Epistulae of Horace in twenty-two hexameter letters, from the moral epistles of Book I to the long letter to Augustus and the letter to Florus in Book II. The Latin Library prints no vowel quantities, so the macra throughout this edition are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu. One reading is given for each letter.",
  "accent": "wine",
  "status": "active",
  "kind": "reader",
  "unit": "Epistula",
  "unitPlural": "Epistulae",
  "readingUnit": "epistula",
  "readingUnitPlural": "epistulae",
  "collectionLabel": "Epistulae",
  "readingLabel": "Epistula",
  "collectionNote": "The complete Epistulae, with one reading for each letter and the verse line breaks of the Latin Library text preserved.",
  "startLabel": "Start Liber I",
  "sourceUnit": "Ep.",
  "chapterCount": 2,
  "readingCount": 22,
  "readyCount": 2,
  chapters,
  extras,
}

export default book
