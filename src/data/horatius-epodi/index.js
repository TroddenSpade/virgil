// Horace: Epodi — Latin text after the Latin Library electronic edition.
// Macra are editorial: the source prints none, and they were supplied with the
// Alatius Latin Macronizer. The Diacritics menu can hide them.

import { outline } from './outline.js'
import { detailed } from './epodi.js'
import { extras } from './extras.js'

export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  "id": "horatius-epodi",
  "slug": "horatius-epodi",
  "title": "Horace: Epodi",
  "latinTitle": "Q. HORATII FLACCI EPODI",
  "shortTitle": "Epodi",
  "author": "Q. Horātius Flaccus",
  "edition": "Digital edition after the Latin Library",
  "year": 2026,
  "publisher": "The Latin Library",
  "isbn": "",
  "level": "Reader — Epodi",
  "language": "Latin",
  "summary": "Horace’s Liber Epodon in the Latin Library text: seventeen iambic poems on love, invective, magic, and civil war.",
  "description": "The Epodi of Horace in seventeen poems, from the iambic invectives and the Canidia poems to the civic epodes on Actium and the Roman people. The Latin Library prints no vowel quantities, so the macra throughout this edition are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu. One reading is given for each epode.",
  "accent": "wine",
  "status": "active",
  "kind": "reader",
  "unit": "Epodus",
  "unitPlural": "Epodi",
  "readingUnit": "epodus",
  "readingUnitPlural": "epodi",
  "collectionLabel": "Epodi",
  "readingLabel": "Epodus",
  "collectionNote": "The complete Liber Epodon, with one reading for each epode and the verse line breaks of the Latin Library text preserved.",
  "startLabel": "Start Epodus I",
  "sourceUnit": "Epod.",
  "chapterCount": 1,
  "readingCount": 17,
  "readyCount": 1,
  chapters,
  extras,
}

export default book
