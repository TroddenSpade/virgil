// Horace: Sermones — Latin text after the Latin Library electronic edition.
// Macra are editorial: the source prints none, and they were supplied with the
// Alatius Latin Macronizer. The Diacritics menu can hide them.

import { outline } from './outline.js'
import { detailed } from './sermones.js'
import { extras } from './extras.js'

export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  "id": "horatius-sermones",
  "slug": "horatius-sermones",
  "title": "Horace: Sermones",
  "latinTitle": "Q. HORATII FLACCI SERMONES",
  "shortTitle": "Sermones",
  "author": "Q. Horātius Flaccus",
  "edition": "Digital edition after the Latin Library",
  "year": 2026,
  "publisher": "The Latin Library",
  "isbn": "",
  "level": "Reader — Sermones",
  "language": "Latin",
  "summary": "The two books of Horace’s Sermones in the Latin Library text: eighteen hexameter satires on discontent, patronage, money, and the art of living.",
  "description": "The Sermones of Horace in eighteen satires, from the diatribes and anecdotes of Book I to the dialogues and fables of Book II. The Latin Library prints no vowel quantities, so the macra throughout this edition are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu. One reading is given for each satire, and the verse line breaks of the source are preserved.",
  "accent": "ivory",
  "status": "active",
  "kind": "reader",
  "unit": "Sermo",
  "unitPlural": "Sermones",
  "readingUnit": "sermo",
  "readingUnitPlural": "sermones",
  "collectionLabel": "Sermones",
  "readingLabel": "Sermo",
  "collectionNote": "The complete Sermones, with one reading for each satire and the verse line breaks of the Latin Library text preserved.",
  "startLabel": "Start Liber I",
  "sourceUnit": "Serm.",
  "chapterCount": 2,
  "readingCount": 18,
  "readyCount": 2,
  chapters,
  extras,
}

export default book
