import { useCallback, useEffect, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage.js'
import {
  DEFAULT_READING_APPEARANCE,
  READING_APPEARANCE_KEY,
  READING_SCALES,
  normalizeReadingAppearance,
  readingAppearanceVariables,
  stepReadingScale,
} from '../lib/reading-appearance.js'

/**
 * The reading appearance preference shared by every reading toolbar.
 *
 * The values are written to <html> as CSS custom properties so the chapter
 * reader, reference chapters and any future reading surface scale together.
 */
export function useReadingAppearance() {
  const [stored, setStored] = useLocalStorage(
    READING_APPEARANCE_KEY,
    DEFAULT_READING_APPEARANCE,
  )
  const appearance = useMemo(
    () => normalizeReadingAppearance(stored),
    [stored],
  )

  useEffect(() => {
    const root = document.documentElement
    const variables = readingAppearanceVariables(appearance)
    for (const [name, value] of Object.entries(variables)) {
      root.style.setProperty(name, value)
    }
  }, [appearance])

  const changeScale = useCallback(
    (direction) => {
      setStored((current) => ({
        ...normalizeReadingAppearance(current),
        scale: stepReadingScale(current, direction),
      }))
    },
    [setStored],
  )

  const setMeasure = useCallback(
    (measure) => {
      setStored((current) => ({
        ...normalizeReadingAppearance(current),
        measure,
      }))
    },
    [setStored],
  )

  const reset = useCallback(
    () => setStored(DEFAULT_READING_APPEARANCE),
    [setStored],
  )

  return {
    appearance,
    changeScale,
    setMeasure,
    reset,
    canDecrease: appearance.scale > READING_SCALES[0],
    canIncrease: appearance.scale < READING_SCALES[READING_SCALES.length - 1],
  }
}
