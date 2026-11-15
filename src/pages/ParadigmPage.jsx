import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  dictionaryKeys,
  hasDefinition,
  norm,
  wordHref,
} from '../lib/dictionary.js'
import { principalParts } from '../lib/grammar.js'
import {
  buildParadigm,
  groupParadigm,
  loadParadigmRules,
} from '../lib/paradigm.js'

export default function ParadigmPage() {
  const { word } = useParams()
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
    () => (lemma && rules ? buildParadigm(lemma, rules) : []),
    [lemma, rules],
  )
  const groups = useMemo(() => groupParadigm(entries), [entries])
  const principal = lemma ? principalParts(lemma.latin) : []

  if (error) {
    return (
      <section className="section paradigm-page">
        <div className="container-narrow">
          <Link to={wordHref(word)} className="back-link">← Back to the entry</Link>
          <h1>Paradigm</h1>
          <p className="notice">Could not load the paradigm. {error.message}</p>
        </div>
      </section>
    )
  }

  if (!data || !rules) {
    return (
      <section className="section paradigm-page">
        <div className="container-narrow">
          <Link to={wordHref(word)} className="back-link">← Back to the entry</Link>
          <h1>Paradigm</h1>
          <p className="muted">Loading the paradigm…</p>
        </div>
      </section>
    )
  }

  if (!lemma) {
    return (
      <section className="section paradigm-page">
        <div className="container-narrow">
          <Link to="/dictionary" className="back-link">← Lexicon</Link>
          <h1 className="lexicon__latin latin">{word}</h1>
          <p className="notice">
            This word is not in the lexicon, so there is no paradigm to show.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="section paradigm-page">
      <div className="container-narrow">
        <nav className="dict-crumb">
          <Link to="/dictionary">← Lexicon</Link>
          <span aria-hidden="true">·</span>
          <Link to={wordHref(lemma.headword)}>Back to the entry</Link>
        </nav>

        <header className="paradigm-head">
          <p className="eyebrow">Paradigma</p>
          <h1 className="lexicon__latin latin">{lemma.headword}</h1>
          {principal.length > 1 && (
            <p className="paradigm-head__principal latin">{principal.join(', ')}</p>
          )}
          <p className="paradigm-head__meta">
            {lemma.pos && lemma.pos !== 'other' ? lemma.pos : 'lexicon'}
            {hasDefinition(lemma.english) ? ` · ${lemma.english}` : ''}
          </p>
        </header>

        {entries.length === 0 ? (
          <p className="notice">
            Whitaker’s Words has no inflection data for this lemma.
          </p>
        ) : (
          <div className="paradigm-groups">
            {groups.map((group, index) => (
              <details className="paradigm-group" key={group.title} open={index === 0}>
                <summary className="paradigm-group__title">{group.title}</summary>
                <dl className="paradigm-list">
                  {group.items.map((entry) => (
                    <div className="paradigm-row" key={entry.slot}>
                      <dt>{entry.label}</dt>
                      <dd className="latin">{entry.form}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            ))}
          </div>
        )}

        <p className="paradigm-note">
          Forms are generated from Whitaker’s Words. The source does not record
          macra for every generated form, so some appear without them.
        </p>
      </div>
    </section>
  )
}
