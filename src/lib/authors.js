// Shared author identity for the Latīnistae shelf. The data modules use full
// Latin names; the shelf filter and the home-page summary use short English
// names and group every work by the same author.

export const AUTHOR_ORDER = [
  'Caesar',
  'Cicero',
  'Catullus',
  'Vergil',
  'Horace',
  'Ovid',
]

const RULES = [
  ['Caesar', /caesar|hirti/i],
  ['Cicero', /cicero/i],
  ['Catullus', /catull/i],
  ['Vergil', /vergili|virgil/i],
  ['Horace', /horat/i],
  ['Ovid', /ovid/i],
]

export function authorIdentity(book) {
  const raw = String(book?.author || book?.slug || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
  for (const [label, pattern] of RULES) {
    if (pattern.test(raw)) return { key: label.toLowerCase(), label }
  }
  return { key: raw.toLowerCase() || 'anonymous', label: raw || 'Anonymous' }
}

export function authorRank(label) {
  const index = AUTHOR_ORDER.indexOf(label)
  return index === -1 ? AUTHOR_ORDER.length : index
}


/** Book title without the "Author: " prefix, for the Latīnistae shelf. */
export function displayTitle(book) {
  if (!book) return ''
  if (!book.isAuthorShelf) return book.title || ''
  return String(book.title || '').replace(/^[^:]+:\s*/, '')
}
