import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Loading from '../components/Loading.jsx'
import {
  norm,
  dictionaryKeys,
  hasDefinition,
  wordHref,
  paradigmHref,
  sourceHref,
  sourceLabel,
  exampleSegments,
} from '../lib/dictionary.js'

export default function DictionaryDetail() {
  const { word } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    import('../data/dictionary.generated.js')
      .then((module) => {
        if (!cancelled) setData(module)
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

  // The key that actually matched, used to mark the current form and find
  // the neighbouring entries when a messy headword was resolved leniently.
  const normWord = wordEntry
    ? norm(wordEntry.w)
    : lemma
      ? norm(lemma.headword)
      : lookupKeys[0] || ''

  const isForm = !!lemma && !!wordEntry && norm(wordEntry.w) !== norm(lemma.headword)

  const example = useMemo(() => {
    if (!data) return null
    const id = wordEntry?.e ?? lemma?.e
    if (id == null) return null
    const item = data.examples?.[id]
    if (!item) return null
    return { ...item, source: data.sources[item.s] || null }
  }, [data, wordEntry, lemma])

  const neighbours = useMemo(() => {
    if (!data || !wordEntry) return { prev: null, next: null }
    const index = data.words.findIndex((entry) => norm(entry.w) === normWord)
    return {
      prev: index > 0 ? data.words[index - 1] : null,
      next: index >= 0 && index < data.words.length - 1 ? data.words[index + 1] : null,
    }
  }, [data, wordEntry, normWord])

  const entry = lemma
    ? {
        ...lemma,
        headword: wordEntry ? wordEntry.w : lemma.headword,
        latin: wordEntry && isForm ? wordEntry.w : lemma.latin,
      }
    : null

  const crumb = (
    <nav className="dict-crumb">
      <Link to="/dictionary">← Lexicon</Link>
      {entry?.headword && (
        <>
          <span aria-hidden="true">·</span>
          <span>Letter {norm(entry.headword)[0]?.toUpperCase()}</span>
        </>
      )}
    </nav>
  )

  if (error) {
    return (
      <section className="section dictionary-leaf-page">
        <div className="container-narrow">
          {crumb}
          <h1>Dictionary</h1>
          <p className="notice">Could not load the dictionary. {error.message}</p>
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section className="section dictionary-leaf-page">
        <div className="container-narrow">
          {crumb}
          <h1>Dictionary</h1>
          <Loading
            compact
            title="Loading the dictionary"
            hint="Finding this entry and its forms in the lexicon."
          />
        </div>
      </section>
    )
  }

  if (!entry) {
    return (
      <section className="section dictionary-leaf-page">
        <div className="container-narrow">
          <nav className="dict-crumb">
            <Link to="/dictionary">← Lexicon</Link>
          </nav>
          <div className="lexicon lexicon--empty">
            <p className="eyebrow">Lexicon</p>
            <h1 className="lexicon__latin latin">{word}</h1>
            <p className="lexicon__meaning lexicon__meaning--none">
              This word is not in the lexicon. It may be a spelling not found in the
              readings, or a word outside the course.
            </p>
            <p className="lexicon__lookup">
              Look it up online:
              {' '}
              <a
                href={`https://latin-dictionary.net/search/latin/${encodeURIComponent(word || '')}`}
                target="_blank"
                rel="noreferrer"
              >
                latin-dictionary.net
              </a>
              {' · '}
              <a
                href={`https://www.online-latin-dictionary.com/latin-english-dictionary.php?parola=${encodeURIComponent(word || '')}`}
                target="_blank"
                rel="noreferrer"
              >
                online-latin-dictionary.com
              </a>
            </p>
            <p>
              <Link className="btn btn--ghost btn--sm" to="/dictionary">
                Back to the dictionary
              </Link>
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section dictionary-leaf-page">
      <div className="container-narrow">
        {crumb}

        <article className="lexicon">
          <header className="lexicon__head">
            <p className="eyebrow">{isForm ? 'Form' : 'Lexicon'}</p>
            <h1 className="lexicon__latin latin">{entry.latin}</h1>
            <div className="lexicon__meta">
              {entry.pos && entry.pos !== 'other' && <span className="lexicon__pos">{entry.pos}</span>}
            </div>
          </header>

          {isForm && (
            <p className="lexicon__form-note">
              <span className="latin">{wordEntry.w}</span> is a form of{' '}
              <Link className="latin" to={wordHref(lemma.headword)}>
                {lemma.headword}
              </Link>
              .
            </p>
          )}

          <p className="lexicon__paradigm-link">
            <Link to={paradigmHref(lemma.headword)}>Full paradigm →</Link>
          </p>

          <section className="lexicon__sense">
            <p className="lexicon__section-title">Sense</p>
            {hasDefinition(entry.english) ? (
              <p className="lexicon__meaning">{entry.english}</p>
            ) : (
              <p className="lexicon__meaning lexicon__meaning--none">
                No definition is recorded for this word. Its use can be read in the passages below.
              </p>
            )}
          </section>

          {entry.forms?.length > 0 && (
            <section className="lexicon__forms">
              <p className="lexicon__section-title">
                Forms in the readings
                <span className="lexicon__section-count">{entry.forms.length}</span>
              </p>
              <ul className="lexicon__form-list">
                {entry.forms.map((form) => (
                  <li key={form} className={norm(form) === normWord ? 'is-current' : ''}>
                    <span className="latin">{form}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {example && (
            <section className="lexicon__passages">
              <p className="lexicon__section-title">
                {example.vocab ? 'From the vocabulary' : 'In the readings'}
              </p>
              <ol className="lexicon__examples">
                <li className="dict-example">
                  <p className="dict-example__latin latin">
                    {exampleSegments(example.latin).map((segment, j) =>
                      segment.mark ? (
                        <mark className="dict-mark" key={j}>
                          {segment.t}
                        </mark>
                      ) : (
                        <span key={j}>{segment.t}</span>
                      ),
                    )}
                  </p>
                  {example.source && (
                    <p className="dict-example__source">
                      <Link to={sourceHref(example.source)}>{sourceLabel(example.source)}</Link>
                    </p>
                  )}
                </li>
              </ol>
            </section>
          )}
        </article>

        {(neighbours.prev || neighbours.next) && (
          <nav className="dict-neighbours" aria-label="Nearby words">
            {neighbours.prev ? (
              <Link className="dict-neighbours__link" to={wordHref(neighbours.prev.w)}>
                <span aria-hidden="true">←</span>
                <span className="latin">{neighbours.prev.w}</span>
              </Link>
            ) : (
              <span />
            )}
            {neighbours.next ? (
              <Link className="dict-neighbours__link" to={wordHref(neighbours.next.w)}>
                <span className="latin">{neighbours.next.w}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </section>
  )
}
