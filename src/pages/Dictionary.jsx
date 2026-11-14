import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { norm, hasDefinition, wordHref, sourceLabel } from '../lib/dictionary.js'

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

  /* One row per inflected form, carrying its lemma's sense and the
     chapters where the form occurs. */
  const entries = useMemo(() => {
    if (!data) return []
    const byId = new Map(data.lemmas.map((lemma) => [lemma.id, lemma]))
    return data.words
      .map((word) => {
        const lemma = byId.get(word.l)
        if (!lemma) return null
        return {
          id: norm(word.w),
          latin: word.w,
          headword: word.w,
          letter: norm(word.w).replace(/^[^a-z]+/, '')[0] || '',
          pos: lemma.pos,
          posGroup: lemma.posGroup,
          english: lemma.english,
          lemma: lemma.headword,
          lemmaId: lemma.id,
          sources: (word.s || []).map((index) => data.sources[index]).filter(Boolean),
          sourceCount: word.n || (word.s || []).length,
        }
      })
      .filter(Boolean)
  }, [data])

  const letters = data?.letters || []
  const stats = data?.stats || { words: 0, lemmas: 0, sources: 0, withExamples: 0 }

  const posOptions = useMemo(
    () => POS_ORDER.filter((group) => entries.some((entry) => entry.posGroup === group)),
    [entries],
  )

  const searchIndex = useMemo(
    () =>
      entries.map((entry) => ({
        entry,
        hay: norm(`${entry.headword} ${entry.lemma} ${entry.english}`),
      })),
    [entries],
  )

  const filtered = useMemo(() => {
    const q = norm(query).trim()
    return searchIndex
      .filter(({ entry, hay }) => {
        if (letter !== 'all' && entry.letter !== letter) return false
        if (pos !== 'all' && entry.posGroup !== pos) return false
        if (!q) return true
        return hay.includes(q)
      })
      .map(({ entry }) => entry)
  }, [searchIndex, query, letter, pos])

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
            Every word in the readings of the course — each inflected form, its headword, its
            English sense, and the chapter it was taken from. Headwords carry their macra, so the
            lexicon can be used when checking or proofreading a line of Latin.
          </p>

          <dl className="dictionary-stats">
            <div>
              <dt>Words</dt>
              <dd>{stats.words.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Lemmas</dt>
              <dd>{stats.lemmas.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Chapters</dt>
              <dd>{stats.sources.toLocaleString()}</dd>
            </div>
            <div>
              <dt>With passages</dt>
              <dd>{stats.withExamples.toLocaleString()}</dd>
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
                  placeholder="e.g. rīpa, amabam, river, magnus…"
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
              {filtered.length === 1 ? 'word' : 'words'}
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

                  {entry.lemma && norm(entry.lemma) !== norm(entry.headword) && (
                    <p className="dict-entry__lemma">
                      form of <span className="latin">{entry.lemma}</span>
                    </p>
                  )}

                  {hasDefinition(entry.english) ? (
                    <p className="dict-entry__meaning">{entry.english}</p>
                  ) : (
                    <p className="dict-entry__meaning dict-entry__meaning--none">
                      No definition is recorded for this word.
                    </p>
                  )}

                  <div className="dict-entry__foot">
                    <span className="dict-entry__book">
                      {entry.sources?.[0] ? sourceLabel(entry.sources[0]) : 'Lexicon'}
                    </span>
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
