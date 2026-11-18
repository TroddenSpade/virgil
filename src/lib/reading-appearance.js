// Persisted reading preferences: type size and line measure.
//
// The scale is stored as a plain multiplier so the stored value stays valid
// if the base type size changes. The measure is an id, not a pixel value, so
// the same preference reads correctly at every breakpoint.

export const READING_APPEARANCE_KEY = 'virgil:reading:appearance'

export const READING_SCALES = [0.9, 1, 1.1, 1.2, 1.3]

// Factors, not `ch` lengths: a reading with marginalia has less usable width
// than a reference page, and a phone has less than either. A factor scales
// whatever measure the surface can offer without overflowing it.
export const READING_MEASURES = [
  { id: 'narrow', label: 'Narrow', factor: 0.78 },
  { id: 'regular', label: 'Regular', factor: 0.9 },
  { id: 'wide', label: 'Wide', factor: 1 },
]

export const DEFAULT_READING_APPEARANCE = Object.freeze({
  scale: 1,
  measure: 'wide',
})

const nearestScale = (value) =>
  READING_SCALES.reduce(
    (best, candidate) =>
      Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best,
    DEFAULT_READING_APPEARANCE.scale,
  )

/**
 * Coerce whatever localStorage holds into a usable preference. Missing or
 * malformed fields fall back rather than throwing: a bad stored value must
 * never keep a reading page from rendering.
 */
export function normalizeReadingAppearance(value) {
  const scale = Number(value?.scale)
  const measure = READING_MEASURES.some((item) => item.id === value?.measure)
    ? value.measure
    : DEFAULT_READING_APPEARANCE.measure

  return {
    scale: Number.isFinite(scale) ? nearestScale(scale) : DEFAULT_READING_APPEARANCE.scale,
    measure,
  }
}

/** One step larger or smaller, clamped to the available range. */
export function stepReadingScale(value, direction) {
  const { scale } = normalizeReadingAppearance(value)
  const index = READING_SCALES.indexOf(scale)
  const next = Math.min(
    READING_SCALES.length - 1,
    Math.max(0, index + (direction < 0 ? -1 : 1)),
  )
  return READING_SCALES[next]
}

/**
 * CSS custom properties set on <html>. Keeping them here means the stylesheet
 * only needs one rule per reading surface, and every surface changes together.
 */
export function readingAppearanceVariables(value) {
  const { scale, measure } = normalizeReadingAppearance(value)
  const width = READING_MEASURES.find((item) => item.id === measure)
  return {
    '--reading-scale': String(scale),
    '--reading-measure': String(width?.factor || 1),
  }
}
