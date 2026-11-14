import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { norm, hasDefinition, wordHref } from '../lib/dictionary.js'

const POS_ORDER = [
  'noun',
  'verb',
  'participle',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
  'pronoun',
  'numeral',
  'particle',
  'interjection',
  'other',
]

const PAGE_SIZE = 120

export default function Dictionary() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [letter, setLetter] = useState('all')
  const [pos, setPos] = useState('all')
  const [visible, setVisible] = useState(PAGE_SIZE)

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

  const entries = data?.entries || []
  const letters = data?.letters || []
  const stats = data?.stats || { entries: 0, withExamples: 0 }

  const posOptions = useMemo(
    () => POS_ORDER.filter((group) => entries.some((entry) => entry.posGroup === group)),
    [entries],
  )

  const filtered = useMemo(() => {
    const q = norm(query).trim()
    return entries.filter((entry) => {
      if (letter !== 'all' && entry.letter !== letter) return false
      if (pos !== 'all' && entry.posGroup !== pos) return false
      if (!q) return true
      if (entry.search) return entry.search.includes(q)
      return (
        norm(entry.latin).includes(q) ||
        norm(entry.headword).includes(q) ||
        norm(entry.english).includes(q)
      )
    })
  }, [entries, query, letter, pos])

  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [query, letter, pos])

  return (
    <section className="section dictionary-page">
      <div className="container">
        <header className="dictionary-hero">
          <p className="eyebrow">Lexicon</p>
          <h1>The Dictionary</h1>
          <p className="lead dictionary-page__lead">
            Every headword in the readings of the course, with its English sense, the forms you meet
            in the text, and the passages where it occurs. Headwords carry their macra, so the
            lexicon can be used when checking or proofreading a line of Latin.
          </p>

          <dl className="dictionary-stats">
            <div>
              <dt>Headwords</dt>
              <dd>{stats.entries.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Forms</dt>
              <dd>{stats.forms?.toLocaleString() ?? '—'}</dd>
            </div>
            <div>
              <dt>With passages</dt>
              <dd>{stats.withExamples.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Letters</dt>
              <dd>{letters.length}</dd>
            </div>
          </dl>
        </header>

        {error && <p className="notice">Could not load the dictionary. {error.message}</p>}

        {!data && !error && <p className="muted">Loading the dictionary…</p>}

        {data && (
          <>
            <div className="dictionary-tools">
              <label className="dictionary-field">
                <span className="dictionary-field__label">Search Latin or English</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="e.g. rīpa, river, magnus…"
                  autoComplete="off"
                />
              </label>

              <label className="dictionary-field">
                <span className="dictionary-field__label">Part of speech</span>
                <select value={pos} onChange={(event) => setPos(event.target.value)}>
                  <option value="all">All</option>
                  {posOptions.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <nav className="dictionary-letters" aria-label="Filter by first letter">
              <button
                type="button"
                className={letter === 'all' ? 'is-active' : ''}
                onClick={() => setLetter('all')}
              >
                All
              </button>
              {letters.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={letter === item ? 'is-active' : ''}
                  onClick={() => setLetter(item)}
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </nav>

            <p className="dictionary-count">
              <strong>{filtered.length.toLocaleString()}</strong>{' '}
              {filtered.length === 1 ? 'headword' : 'headwords'}
              {letter !== 'all' && <> in <strong>{letter.toUpperCase()}</strong></>}
              {query && <> matching “{query}”</>}
            </p>

            <div className="dictionary-grid">
              {filtered.slice(0, visible).map((entry) => (
                <Link to={wordHref(entry.headword)} className="dict-entry" key={entry.id}>
                  <div className="dict-entry__head">
                    <h2 className="dict-entry__latin latin">{entry.latin}</h2>
                    {entry.pos && entry.pos !== 'other' && (
                      <span className="dict-entry__pos">{entry.pos}</span>
                    )}
                  </div>

                  {hasDefinition(entry.english) ? (
                    <p className="dict-entry__meaning">{entry.english}</p>
                  ) : (
                    <p className="dict-entry__meaning dict-entry__meaning--none">
                      Definition not yet recorded.
                    </p>
                  )}

                  <div className="dict-entry__foot">
                    <span className="dict-entry__book">
                      {entry.sources?.[0]?.book || 'Lexicon'}
                    </span>
                    {entry.examples?.length > 0 && (
                      <span className="dict-entry__passages">
                        {entry.examples.length}
                        {entry.examples.length === 1 ? ' passage' : ' passages'}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {filtered.length > visible && (
              <div className="dictionary-more">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setVisible((value) => value + PAGE_SIZE)}
                >
                  Show more ({filtered.length - visible} remaining)
                </button>
              </div>
            )}

            {filtered.length === 0 && <p className="dictionary-empty muted">No words match that search.</p>}
          </>
        )}
      </div>
    </section>
  )
}
