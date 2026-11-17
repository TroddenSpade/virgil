// Horace: Carmen Saeculare — Latin text after the Latin Library electronic edition.
// Macra are editorial: the source prints none, and they were supplied with the
// Alatius Latin Macronizer. The Diacritics menu can hide them.

import { outline } from './outline.js'
import { detailed } from './carmen-saeculare.js'
import { extras } from './extras.js'

export const chapters = outline.map((entry) => ({
  ...entry,
  ...(detailed[entry.number] || {}),
  complete: true,
  status: 'complete',
}))

export const book = {
  "id": "horatius-carmen-saeculare",
  "slug": "horatius-carmen-saeculare",
  "title": "Horace: Carmen Saeculare",
  "latinTitle": "Q. HORATII FLACCI CARMEN SAECVLARE",
  "shortTitle": "Carmen Saeculare",
  "author": "Q. Horātius Flaccus",
  "edition": "Digital edition after the Latin Library",
  "year": 2026,
  "publisher": "The Latin Library",
  "isbn": "",
  "level": "Reader — Carmen Saeculare",
  "language": "Latin",
  "summary": "Horace’s Carmen Saeculare in the Latin Library text: 76 lines of Sapphic verse, a choral hymn to Apollo and Diana for the Secular Games.",
  "description": "The Carmen Saeculare in 76 Sapphic lines: a public hymn to Apollo and Diana, praying for the Roman people and the city. The Latin Library prints no vowel quantities, so the macra throughout this edition are editorial, supplied with the Alatius Latin Macronizer, and can be hidden with the Diacritics menu. The hymn is given as a single reading with the verse line breaks of the source preserved.",
  "accent": "gold",
  "status": "active",
  "kind": "reader",
  "unit": "Carmen",
  "unitPlural": "Carmina",
  "readingUnit": "carmen",
  "readingUnitPlural": "carmina",
  "collectionLabel": "Carmen Saeculare",
  "readingLabel": "Carmen",
  "collectionNote": "The complete Carmen Saeculare in a single reading, with the verse line breaks of the Latin Library text preserved.",
  "startLabel": "Start Carmen Saeculare",
  "sourceUnit": "Carm. Saec.",
  "chapterCount": 1,
  "readingCount": 1,
  "readyCount": 1,
  chapters,
  extras,
}

export default book
