import { useCallback, useEffect, useMemo, useState } from 'react'
import { readLocalProgress } from '../lib/progress.js'
import { buildWordlist } from '../lib/wordlist.js'
import {
  REVIEW_KEY,
  emptyReview,
  normalizeReview,
  reviewStats,
} from '../lib/review.js'
import { useLocalStorage } from './useLocalStorage.js'

const PROGRESS_PREFIX = 'virgil:progress:'

function isProgressKey(key) {
  return String(key || '').startsWith(PROGRESS_PREFIX)
}

/**
 * The live personal wordlist and its review state.
 *
 * Progress is read straight from local storage and refreshed whenever a
 * chapter is marked or unmarked — in this tab (`virgil:storage`) or another
 * (`storage`). Review state lives under its own key and is normalized on the
 * way in and out, so a malformed or older copy can never break a session.
 */
export function useWordlist() {
  const [progress, setProgress] = useState(() => readLocalProgress())

  useEffect(() => {
    const refresh = (event) => {
      if (event.type === 'virgil:storage') {
        if (!isProgressKey(event.detail?.key)) return
      } else if (!isProgressKey(event.key)) {
        return
      }
      setProgress(readLocalProgress())
    }

    window.addEventListener('storage', refresh)
    window.addEventListener('virgil:storage', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('virgil:storage', refresh)
    }
  }, [])

  // The clock only needs to move the “due now” boundary while a page is open.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60 * 1000)
    return () => window.clearInterval(timer)
  }, [])

  const [storedReview, setStoredReview] = useLocalStorage(REVIEW_KEY, emptyReview())

  const review = useMemo(() => normalizeReview(storedReview), [storedReview])

  const setReview = useCallback(
    (updater) => {
      setStoredReview((previous) => {
        const base = normalizeReview(previous)
        return normalizeReview(
          typeof updater === 'function' ? updater(base) : updater,
        )
      })
    },
    [setStoredReview],
  )

  const wordlist = useMemo(() => buildWordlist(progress), [progress])
  const stats = useMemo(
    () => reviewStats(wordlist.words, review, now),
    [wordlist, review, now],
  )

  return {
    ...wordlist,
    review,
    setReview,
    stats,
    now,
  }
}
