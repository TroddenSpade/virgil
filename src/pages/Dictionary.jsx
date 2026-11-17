import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Loading from '../components/Loading.jsx'
import DiacriticsControl from '../components/DiacriticsControl.jsx'
import { useDiacritics } from '../hooks/useDiacritics.js'
import { containsDiacritics, stripDiacritics } from '../lib/diacritics.js'
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

const DICTIONARY_LEAD =
  'Every word in the readings of the course — each inflected form, its headword, its ' +
  'English sense, every chapter where it occurs, and an example from the readings or the ' +
  'chapter vocabulary. Headwords carry their macra, so the lexicon can be used when ' +
  'checking or proofreading a line of Latin.'

const DICTIONARY_STATS = [
  { key: 'words', label: 'Words' },
  { key: 'lemmas', label: 'Lemmas' },
  { key: 'sources', label: 'Chapters' },
  { key: 'examples', label: 'With examples' },
]

function DictionaryHero({ stats, loading = false }) {
  return (
    <header className="dictionary-hero">
      <p className="eyebrow">Lexicon</p>
      <h1>The Dictionary</h1>
      <p className="lead dictionary-page__lead">{DICTIONARY_LEAD}</p>

      <dl className="dictionary-stats" aria-busy={loading || undefined}>
        {DICTIONARY_STATS.map(({ key, label }) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>
              {loading ? (
                <span className="dictionary-stat-skeleton" aria-hidden="true" />
              ) : key === 'examples' ? (
                (stats.wordsWithExamples ?? stats.withExamples).toLocaleString()
              ) : (
                stats[key].toLocaleString()
              )}
            </dd>
          </div>
        ))}
      </dl>
    </header>
  )
}

export default function Dictionary() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const diacritics = useDiacritics()

  /* The URL is the source of truth for the filters, so a link such as
     /dictionary?q=volo or /dictionary?letter=v&pos=verb opens on the same
     view and the address bar always shows what is being filtered. */
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const letter = (searchParams.get('letter') || 'all').toLowerCase()
  const pos = searchParams.get('pos') || 'all'

  const updateFilters = (changes) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      for (const [key, value] of Object.entries(changes)) {
        if (!value || value === 'all') next.delete(key)
        else next.set(key, value)
      }
      return next
    }, { replace: true })
  }
  const setQuery = (value) => updateFilters({ q: value })
  const setLetter = (value) => updateFilters({ letter: value })
  const setPos = (value) => updateFilters({ pos: value })
  const clearFilters = () => setSearchParams(new URLSearchParams(), { replace: true })

  useEffect(() => {
    let cancelled = false
    import('../data/dictionary-index.generated.js')
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
     chapters where the form occurs. Normalised ids collapse forms that differ
     only in diacritics (Rōma / Roma); keep the marked spelling for display. */
  const entries = useMemo(() => {
    if (!data) return []
    const byId = new Map(data.lemmas.map((lemma) => [lemma.id, lemma]))
    const byForm = new Map()
    const markCount = (value) =>
      (String(value).match(/[āēīōūȳăĕĭŏŭëïÿáéíóúý]/gi) || []).length

    for (const word of data.words) {
      const lemma = byId.get(word.l)
      if (!lemma) continue
      const id = norm(word.w)
      if (!id) continue
      const entry = {
        id,
        latin: stripDiacritics(word.w, diacritics.options),
        headword: stripDiacritics(word.w, diacritics.options),
        letter: id.replace(/^[^a-z]+/, '')[0] || '',
        pos: lemma.pos,
        posGroup: lemma.posGroup,
        english: lemma.english,
        lemma: stripDiacritics(lemma.headword, diacritics.options),
        lemmaId: lemma.id,
        sources: (word.s || []).map((index) => data.sources[index]).filter(Boolean),
        sourceCount: word.n || (word.s || []).length,
      }
      const existing = byForm.get(id)
      if (!existing || markCount(entry.latin) > markCount(existing.latin)) {
        byForm.set(id, entry)
      }
    }
    return [...byForm.values()]
  }, [data, diacritics.options])

  const hasMarks = useMemo(
    () => Boolean(data?.words?.some((word) => containsDiacritics(word.w))),
    [data],
  )

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

  if (!data && !error) {
    return (
      <section className="section dictionary-page dictionary-loading-page" aria-busy="true">
        <div className="container dictionary-loading">
          <DictionaryHero loading />
          <Loading />
        </div>
      </section>
    )
  }

  return (
    <section className="section dictionary-page">
      <div className="container">
        <DictionaryHero stats={stats} />

        {error && <p className="notice">Could not load the dictionary. {error.message}</p>}

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

              <div className="dictionary-diacritics">
                <DiacriticsControl mode={diacritics} hasMarks={hasMarks} />
              </div>
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

            {filtered.length === 0 && (
              <div className="dictionary-empty muted">
                <p>No words match that search.</p>
                {(query || letter !== 'all' || pos !== 'all') && (
                  <button type="button" className="btn btn--ghost" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
