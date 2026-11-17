import { useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage.js'
import {
  DEFAULT_DIACRITICS,
  DIACRITIC_TYPES,
  HIDDEN_DIACRITICS,
} from '../lib/diacritics.js'

const STORAGE_KEY = 'virgil:diacritics'

/**
 * A single persistent preference for showing diacritics. The controls in each
 * reading section share this store, so toggling one updates the others.
 */
export function useDiacritics() {
  const [stored, setStored] = useLocalStorage(STORAGE_KEY, DEFAULT_DIACRITICS)

  const options = useMemo(
    () => ({ ...DEFAULT_DIACRITICS, ...(stored || {}) }),
    [stored],
  )

  const toggle = useCallback(
    (id) => {
      setStored((current) => {
        const next = { ...DEFAULT_DIACRITICS, ...(current || {}) }
        next[id] = !next[id]
        return next
      })
    },
    [setStored],
  )

  const setOption = useCallback(
    (id, value) => {
      setStored((current) => ({
        ...DEFAULT_DIACRITICS,
        ...(current || {}),
        [id]: Boolean(value),
      }))
    },
    [setStored],
  )

  const showAll = useCallback(() => setStored({ ...DEFAULT_DIACRITICS }), [setStored])
  const hideAll = useCallback(() => setStored({ ...HIDDEN_DIACRITICS }), [setStored])

  const enabledCount = DIACRITIC_TYPES.filter((type) => options[type.id]).length

  return { options, toggle, setOption, showAll, hideAll, enabledCount }
}
