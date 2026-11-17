// Display helpers for the diacritics menu on original-language editions.
//
// The texts themselves are never changed. A reader can hide one class of
// marks at a time; the preference is stored locally by useDiacritics.

export const DIACRITIC_TYPES = [
  { id: 'macrons', label: 'Macrons', example: 'ā' },
  { id: 'breves', label: 'Breves', example: 'ă' },
  { id: 'diaereses', label: 'Diaereses', example: 'ë' },
  { id: 'acutes', label: 'Acute Accents', example: 'á' },
  { id: 'apices', label: 'Apices', example: '´' },
]

export const DEFAULT_DIACRITICS = Object.fromEntries(
  DIACRITIC_TYPES.map((type) => [type.id, true]),
)

export const HIDDEN_DIACRITICS = Object.fromEntries(
  DIACRITIC_TYPES.map((type) => [type.id, false]),
)

const COMBINING_MARK = {
  macrons: '\u0304',
  breves: '\u0306',
  diaereses: '\u0308',
  acutes: '\u0301',
}

// Apices are normally printed as a separate acute-accent character after the
// vowel (a´), not as a combining mark. Both common code points are covered.
const APEX = /[\u00b4\u02ca]/g

/** True when a string contains at least one of the marks the menu controls. */
export function containsDiacritics(text) {
  const value = String(text ?? '')
  if (APEX.test(value)) {
    APEX.lastIndex = 0
    return true
  }
  const decomposed = value.normalize('NFD')
  return Object.values(COMBINING_MARK).some((mark) => decomposed.includes(mark))
}

/**
 * Remove the diacritic classes that are switched off. With every option on,
 * the original string is returned untouched, preserving its exact typography.
 */
export function stripDiacritics(text, options = DEFAULT_DIACRITICS) {
  const value = String(text ?? '')
  if (!value) return value

  const disabledMarks = new Set()
  for (const [type, mark] of Object.entries(COMBINING_MARK)) {
    if (options[type] === false) disabledMarks.add(mark)
  }
  const hideApices = options.apices === false
  if (!disabledMarks.size && !hideApices) return value

  let result = ''
  for (const character of value.normalize('NFD')) {
    if (!disabledMarks.has(character)) result += character
  }
  if (hideApices) result = result.replace(APEX, '')
  return result.normalize('NFC')
}

/** Apply a preference set to every Latin field of a reading. */
export function applyDiacriticsToReading(reading, options) {
  if (!reading) return reading
  return {
    ...reading,
    latinTitle: stripDiacritics(reading.latinTitle, options),
    personae: stripDiacritics(reading.personae, options),
    paragraphs: (reading.paragraphs || []).map((paragraph) =>
      stripDiacritics(paragraph, options),
    ),
    notes: (reading.notes || []).map((note) => ({
      ...note,
      term: stripDiacritics(note.term, options),
      gloss: stripDiacritics(note.gloss, options),
    })),
  }
}

export function applyDiacriticsToReadings(readings, options) {
  if (!readings) return readings
  return readings.map((reading) => applyDiacriticsToReading(reading, options))
}

export function readingHasDiacritics(reading) {
  if (!reading) return false
  const fields = [
    reading.latinTitle,
    reading.personae,
    ...(reading.paragraphs || []),
    ...(reading.notes || []).flatMap((note) => [note.term, note.gloss]),
  ]
  return fields.some(containsDiacritics)
}
