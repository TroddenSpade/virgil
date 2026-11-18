import { useEffect, useState } from 'react'
import { loadBook } from '../data/book-loader.js'

/**
 * Load one book's full text. The light registry already provides the title
 * and chapter outline, so this hook is only used by reading pages.
 */
export function useBookData(slug) {
  const [state, setState] = useState(() => ({
    book: null,
    status: slug ? 'loading' : 'missing',
  }))

  useEffect(() => {
    let cancelled = false

    if (!slug) {
      setState({ book: null, status: 'missing' })
      return undefined
    }

    setState({ book: null, status: 'loading' })
    loadBook(slug)
      .then((book) => {
        if (cancelled) return
        setState({ book, status: book ? 'ready' : 'missing' })
      })
      .catch(() => {
        if (!cancelled) setState({ book: null, status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  return state
}

export default useBookData
