import { outline } from './outline.js'
import { extras } from './extras.js'
import cena from './cena.js'

export const chapters = outline.map((entry) => ({ ...entry, ...cena }))

export const book = {
  id: 'petronius-cena-trimalchionis',
  slug: 'petronius-cena-trimalchionis',
  title: 'Petronius: Cena Trimalchionis',
  latinTitle: 'PETRONII CENA TRIMALCHIONIS',
  shortTitle: 'Cena Trimalchionis',
  author: 'Petronius',
  edition: 'Hans H. Ørberg (ed.)',
  year: 2003,
  publisher: 'Domus Latina',
  isbn: '978-1-58510-156-6',
  level: 'Reader — Petronius’ Cena',
  language: 'Latin',
  summary: 'Petronius’ comic account of Trimalchio’s dinner, edited for students of the Lingua Latina course, with the edition’s own marginal notes and vocabulary.',
  description: 'The Cena Trimalchionis, the most famous episode of Petronius’ Satyricon, with its feast, its freedmen and its grotesque host. The Latin text follows Hans H. Ørberg’s edition, with the printed macra, marginal notes, preface, personae and indexes.',
  accent: 'wine',
  status: 'active',
  kind: 'reader',
  unit: 'Cena',
  unitPlural: 'Cena',
  readingUnit: 'sectiō',
  readingUnitPlural: 'sectiōnēs',
  collectionLabel: 'Cena',
  readingLabel: 'Sectiō',
  collectionNote: 'The continuous text of the Cena, divided into the edition’s numbered sections, with the marginal notes.',
  startLabel: 'Incipit Cēna',
  chapterCount: 1,
  readingCount: chapters.reduce((n,c)=>n+c.readings.length,0),
  readyCount: 1,
  chapters,
  extras,
}

export default book
