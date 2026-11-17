// Horace: Carmina — Latin text after the Latin Library electronic edition.
// Macra are editorial: the source prints none, and they were supplied with the
// Alatius Latin Macronizer. The Diacritics menu can hide them.

import { outline } from './outline.js'
import { detailed } from './carmina.js'
import { extras } from './extras.js'

export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  "id": "horatius-carmina",
  "slug": "horatius-carmina",
  "title": "Horace: Carmina",
  "latinTitle": "Q. HORATII FLACCI CARMINA",
  "shortTitle": "Carmina",
  "author": "Q. Horātius Flaccus",
  "edition": "Digital edition after the Latin Library",
  "year": 2026,
  "publisher": "The Latin Library",
  "isbn": "",
  "level": "Reader — Carmina",
  "language": "Latin",
  "summary": "The four books of Horace’s Carmina in the Latin Library text: 103 odes in Sapphic, Alcaic, and other lyric metres, from the dedication to Maecenas to the closing poem on peace and song.",
  "description": "The Carmina of Horace in four books and 103 odes, with the lyric metres and stanzaic structure of the source preserved line by line. The Latin Library prints no vowel quantities, so the macra throughout this edition are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu. One reading is given for each poem.",
  "accent": "gold",
  "status": "active",
  "kind": "reader",
  "unit": "Carmen",
  "unitPlural": "Carmina",
  "readingUnit": "carmen",
  "readingUnitPlural": "carmina",
  "collectionLabel": "Carmina",
  "readingLabel": "Carmen",
  "collectionNote": "The complete Carmina, with one reading for each ode and the verse line breaks of the Latin Library text preserved.",
  "startLabel": "Start Liber I",
  "sourceUnit": "Carm.",
  "chapterCount": 4,
  "readingCount": 103,
  "readyCount": 4,
  chapters,
  extras,
}

export default book
