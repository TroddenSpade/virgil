import { useEffect, useMemo, useState } from 'react'
import { dictionaryKeys, norm } from '../lib/dictionary.js'
import { buildParadigm, loadParadigmRules } from '../lib/paradigm.js'

/** Load a word's dictionary lemma and its generated paradigm. */
export function useParadigm(word) {
  const [data, setData] = useState(null)
  const [rules, setRules] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      import('../data/dictionary.generated.js'),
      loadParadigmRules(),
    ])
      .then(([dictionary, paradigmRules]) => {
        if (cancelled) return
        setData(dictionary)
        setRules(paradigmRules)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const lookupKeys = useMemo(
    () => dictionaryKeys(word).map((key) => norm(key)),
    [word],
  )

  const wordEntry = useMemo(() => {
    for (const key of lookupKeys) {
      const match = (data?.words || []).find((entry) => norm(entry.w) === key)
      if (match) return match
    }
    return null
  }, [data, lookupKeys])

  const lemma = useMemo(() => {
    if (!data) return null
    if (wordEntry) return data.lemmas.find((entry) => entry.id === wordEntry.l) || null
    for (const key of lookupKeys) {
      const match = data.lemmas.find((entry) => norm(entry.headword) === key)
      if (match) return match
    }
    return null
  }, [data, wordEntry, lookupKeys])

  const entries = useMemo(
    () => (lemma && rules ? buildParadigm(lemma, rules, data?.surfaceForms) : []),
    [lemma, rules, data],
  )

  return {
    data,
    rules,
    error,
    wordEntry,
    lemma,
    entries,
    loading: !data || !rules,
  }
}
