// Horace: Ars Poetica — Latin text after the Latin Library electronic edition.
// Macra are editorial: the source prints none, and they were supplied with the
// Alatius Latin Macronizer. The Diacritics menu can hide them.

import { outline } from './outline.js'
import { detailed } from './ars-poetica.js'
import { extras } from './extras.js'

export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  "id": "horatius-ars-poetica",
  "slug": "horatius-ars-poetica",
  "title": "Horace: Ars Poetica",
  "latinTitle": "Q. HORATII FLACCI ARS POETICA",
  "shortTitle": "Ars Poetica",
  "author": "Q. Horātius Flaccus",
  "edition": "Digital edition after the Latin Library",
  "year": 2026,
  "publisher": "The Latin Library",
  "isbn": "",
  "level": "Reader — Ars Poetica",
  "language": "Latin",
  "summary": "Horace’s Ars Poetica in the Latin Library text: 476 hexameters of advice on poetry, drama, and the training of the poet, addressed to the Pisos.",
  "description": "The Ars Poetica, Horace’s hexameter epistle on the art of poetry, in 476 lines. The Latin Library prints no vowel quantities, so the macra throughout this edition are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu. The poem is given as a single reading with the verse line breaks of the source preserved.",
  "accent": "laurel",
  "status": "active",
  "kind": "reader",
  "unit": "Carmen",
  "unitPlural": "Carmina",
  "readingUnit": "carmen",
  "readingUnitPlural": "carmina",
  "collectionLabel": "Ars Poetica",
  "readingLabel": "Carmen",
  "collectionNote": "The complete Ars Poetica in a single reading, with the verse line breaks of the Latin Library text preserved.",
  "startLabel": "Start Ars Poetica",
  "sourceUnit": "Ars",
  "chapterCount": 1,
  "readingCount": 1,
  "readyCount": 1,
  chapters,
  extras,
}

export default book
