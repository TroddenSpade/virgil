import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  markWordKnown,
  readSavedWords,
  removeSavedWord,
  saveWord,
  subscribeSavedWords,
  unmarkWordKnown,
} from '../lib/saved-words.js'

/** The reader's hand-saved and already-known words, kept in sync across tabs. */
export function useSavedWords() {
  const [state, setState] = useState(() => readSavedWords())

  useEffect(() => {
    const refresh = () => setState(readSavedWords())
    return subscribeSavedWords(refresh)
  }, [])

  const save = useCallback((entry) => {
    setState(saveWord(entry))
  }, [])

  const remove = useCallback((key) => {
    setState(removeSavedWord(key))
  }, [])

  const know = useCallback((key) => {
    setState(markWordKnown(key))
  }, [])

  const unknow = useCallback((key) => {
    setState(unmarkWordKnown(key))
  }, [])

  return useMemo(
    () => ({ ...state, save, remove, know, unknow }),
    [state, save, remove, know, unknow],
  )
}
