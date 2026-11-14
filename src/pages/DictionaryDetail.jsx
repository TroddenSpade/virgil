import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { norm, hasDefinition, bookHref, wordHref, exampleSegments } from '../lib/dictionary.js'

const EXAMPLE_LIMIT = 12

export default function DictionaryDetail() {
  const { word } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [showAll, setShowAll] = useState(false)

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

  // Reset the passage list whenever the reader moves to another word.
  useEffect(() => {
    setShowAll(false)
  }, [word])

  const entries = data?.entries || []
  const normWord = norm(word)

  const directIndex = useMemo(
    () => entries.findIndex((entry) => norm(entry.headword) === normWord),
    [entries, normWord],
  )
  const targetId = directIndex < 0 ? data?.formIndex?.[normWord] : null
  const index =
    directIndex >= 0
      ? directIndex
      : targetId
        ? entries.findIndex((entry) => entry.id === targetId)
        : -1
  const entry = index >= 0 ? entries[index] : null
  const isForm = !!entry && norm(entry.headword) !== normWord
  const prev = index > 0 ? entries[index - 1] : null
  const next = index >= 0 && index < entries.length - 1 ? entries[index + 1] : null

  const crumb = (
    <nav className="dict-crumb">
      <Link to="/dictionary">← Lexicon</Link>
      {entry?.letter && (
        <>
          <span aria-hidden="true">·</span>
          <span>Letter {entry.letter.toUpperCase()}</span>
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
          <p className="muted">Loading the dictionary…</p>
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
              This word is not in the lexicon.
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

  const examples = entry.examples || []
  const shown = showAll ? examples : examples.slice(0, EXAMPLE_LIMIT)

  return (
    <section className="section dictionary-leaf-page">
      <div className="container-narrow">
        {crumb}

        <article className="lexicon">
          <header className="lexicon__head">
            <p className="eyebrow">Lexicon</p>
            <h1 className="lexicon__latin latin">{entry.latin}</h1>
            <div className="lexicon__meta">
              {entry.pos && entry.pos !== 'other' && <span className="lexicon__pos">{entry.pos}</span>}
              {entry.sources?.[0] && (
                <Link className="lexicon__source" to={bookHref(entry.sources[0])}>
                  {entry.sources[0].book}
                </Link>
              )}
              {examples.length > 0 && (
                <span className="muted">
                  {examples.length} {examples.length === 1 ? 'passage' : 'passages'}
                </span>
              )}
            </div>
          </header>

          {isForm && (
            <p className="lexicon__form-note">
              <span className="latin">{word}</span> is a form of{' '}
              <Link className="latin" to={wordHref(entry.headword)}>
                {entry.headword}
              </Link>
              .
            </p>
          )}

          <section className="lexicon__sense">
            <p className="lexicon__section-title">Sense</p>
            {hasDefinition(entry.english) ? (
              <p className="lexicon__meaning">{entry.english}</p>
            ) : (
              <p className="lexicon__meaning lexicon__meaning--none">
                No definition is recorded for this word in the course vocabulary. Its use can be read
                in the passages below.
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

          {examples.length > 0 && (
            <section className="lexicon__passages">
              <p className="lexicon__section-title">
                In the readings
                <span className="lexicon__section-count">{examples.length}</span>
              </p>
              <ol className="lexicon__examples">
                {shown.map((example, i) => (
                  <li className="dict-example" key={`${example.book}-${i}`}>
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
                    <p className="dict-example__source">{example.book}</p>
                  </li>
                ))}
              </ol>

              {examples.length > shown.length && (
                <div className="lexicon__more">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowAll(true)}>
                    Show all {examples.length} passages
                  </button>
                </div>
              )}
            </section>
          )}
        </article>

        {(prev || next) && (
          <nav className="dict-neighbours" aria-label="Nearby words">
            {prev ? (
              <Link className="dict-neighbours__link" to={wordHref(prev.headword)}>
                <span aria-hidden="true">←</span>
                <span className="latin">{prev.latin}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link className="dict-neighbours__link" to={wordHref(next.headword)}>
                <span className="latin">{next.latin}</span>
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
