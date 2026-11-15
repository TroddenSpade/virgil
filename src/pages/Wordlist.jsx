import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWordlist } from '../hooks/useWordlist.js'
import {
  STATUS_OPTIONS,
  dueLabel,
  stateFor,
  statusOf,
} from '../lib/review.js'
import {
  sourceLabel,
  stripMacra,
} from '../lib/wordlist.js'
import { wordHref } from '../lib/dictionary.js'

const PAGE_SIZE = 80

// Alphabetize enclitics by the word itself ("-ne" under N, "-que" under Q)
// while still printing the hyphen.
const alphaKey = (word) => word.headword.replace(/^-/, '')

const SORT_OPTIONS = [
  { key: 'alpha', label: 'A–Z' },
  { key: 'lesson', label: 'Lesson order' },
  { key: 'review', label: 'Review order' },
]

function filterCount(counts, key) {
  if (key === 'all') return counts.all || 0
  return counts[key] || 0
}

function WordRow({ word, state, now }) {
  const status = statusOf(state, now)
  const extraKinds = Math.max(0, word.senseGroups.length - 1)

  return (
    <details className="word-row">
      <summary className="word-row__summary">
        <span className="word-row__word">
          <span className="word-row__latin latin">{word.headword}</span>
          {word.principal && (
            <span className="word-row__principal latin">{word.principal}</span>
          )}
        </span>

        <span className="word-row__sense">
          {word.primarySense ? (
            <>
              <span className="word-row__kind">{word.kindLabel}</span>
              <span className="word-row__english">{word.primarySense}</span>
              {extraKinds > 0 && (
                <span className="word-row__more">+{extraKinds}</span>
              )}
            </>
          ) : (
            <span className="muted">No gloss recorded</span>
          )}
        </span>

        <span className="word-row__meta">
          <span className={`word-status word-status--${status.key}`}>
            {status.label}
          </span>
          {word.saved && <span className="word-row__saved">saved</span>}
          {word.firstSource && (
            <span className="word-row__source">
              {sourceLabel(word.firstSource)}
              {word.sourceCount > 1 ? ` +${word.sourceCount - 1}` : ''}
            </span>
          )}
        </span>

        <span className="word-row__toggle" aria-hidden="true">
          +
        </span>
      </summary>

      <div className="word-row__body">
        <div className="word-row__senses">
          <p className="word-row__section-title">Senses</p>
          {word.senseGroups.length > 0 ? (
            <dl className="word-senses">
              {word.senseGroups.map((group) => (
                <div key={group.kind}>
                  <dt>{group.label}</dt>
                  <dd>{group.all.join('; ')}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="muted">No gloss is recorded for this word.</p>
          )}
        </div>

        <div className="word-row__sources">
          <p className="word-row__section-title">
            Where you met it
            <span className="word-row__section-count">{word.sourceCount}</span>
          </p>
          <ul className="word-sources">
            {word.sources.map((source) => (
              <li key={`${source.bookId}:${source.number}`}>
                <Link to={source.href}>{sourceLabel(source)}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="word-row__footer">
          <p className="word-row__review">
            {dueLabel(state, now)}
            {state?.seen
              ? ` · seen ${state.seen} ${state.seen === 1 ? 'time' : 'times'}`
              : ''}
          </p>
          <Link className="word-row__dictionary" to={wordHref(word.headword)}>
            Open in the lexicon →
          </Link>
        </div>
      </div>
    </details>
  )
}

function EmptyWordlist({ studiedChapters }) {
  const waiting = studiedChapters === 0

  return (
    <section className="wordlist-empty card">
      <div className="wordlist-empty__mark" aria-hidden="true">
        <span className="latin">A</span>
      </div>
      <div>
        <p className="eyebrow">{waiting ? 'Nōndum verba' : 'Nōn sunt verba'}</p>
        <h2>{waiting ? 'Your wordlist is waiting.' : 'No words yet from these lessons.'}</h2>
        <p className="lead">
          {waiting
            ? 'Mark a chapter as learned and its words will appear here automatically — or turn on Lexicon mode in a reading and save a word you want to keep. The list follows your progress: add a chapter, add its words; take it back, and the words leave again.'
            : 'The wordlist gathers the printed vocabulary and the reading vocabulary of every chapter you mark, plus any words you save from a reading. The chapters you have marked so far contain no indexed words.'}
        </p>
        <div className="wordlist-empty__actions">
          <Link className="btn btn--primary" to="/iter">
            Open the itinerary →
          </Link>
          <Link className="btn btn--ghost" to="/library">
            Browse the library
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function Wordlist() {
  const {
    words,
    sourceBooks,
    stats,
    review,
    now,
    studiedChapters,
    contributingChapters,
    savedCount,
  } = useWordlist()

  const [query, setQuery] = useState('')
  const [book, setBook] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('alpha')
  const [visible, setVisible] = useState(PAGE_SIZE)

  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [query, book, status, sort])

  const bookCounts = useMemo(() => {
    const counts = new Map()
    for (const word of words) {
      const seen = new Set()
      for (const source of word.sources) {
        if (seen.has(source.bookId)) continue
        seen.add(source.bookId)
        counts.set(source.bookId, (counts.get(source.bookId) || 0) + 1)
      }
    }
    return counts
  }, [words])

  const contextWords = useMemo(() => {
    const q = stripMacra(query).trim()
    let list = words

    if (book !== 'all') {
      list = list.filter((word) =>
        word.sources.some((source) => source.bookId === book),
      )
    }

    if (q) list = list.filter((word) => word.haystack.includes(q))
    return list
  }, [words, book, query])

  // The status plaques count the words in the current search/book context,
  // so they always agree with what the list can show.
  const statusCounts = useMemo(() => {
    const counts = { all: contextWords.length, due: 0, new: 0, learning: 0, mature: 0 }
    for (const word of contextWords) {
      const key = statusOf(stateFor(review, word.key), now).key
      counts[key] = (counts[key] || 0) + 1
    }
    return counts
  }, [contextWords, review, now])

  const filtered = useMemo(() => {
    let list = contextWords

    if (status !== 'all') {
      list = list.filter(
        (word) => statusOf(stateFor(review, word.key), now).key === status,
      )
    }

    if (sort === 'lesson') {
      return [...list].sort(
        (a, b) =>
          a.order - b.order ||
          alphaKey(a).localeCompare(alphaKey(b), 'la'),
      )
    }

    if (sort === 'review') {
      const rank = { due: 0, new: 1, learning: 2, mature: 3 }
      return [...list].sort((a, b) => {
        const statusA = statusOf(stateFor(review, a.key), now).key
        const statusB = statusOf(stateFor(review, b.key), now).key
        return (
          rank[statusA] - rank[statusB] ||
          alphaKey(a).localeCompare(alphaKey(b), 'la')
        )
      })
    }

    return [...list].sort((a, b) =>
      alphaKey(a).localeCompare(alphaKey(b), 'la'),
    )
  }, [contextWords, review, now, status, sort])

  const primaryAction = stats.due > 0
    ? { to: '/wordlist/review?mode=due', label: `Review due · ${stats.due} →` }
    : stats.new > 0
      ? { to: '/wordlist/review?mode=new', label: `Learn new · ${stats.new} →` }
      : words.length > 0
        ? { to: '/wordlist/review', label: 'Open review →' }
        : { to: '/iter', label: 'Begin the course →' }

  return (
    <section className="section wordlist-page">
      <div className="container">
        <header className="wordlist-hero rise">
          <div className="wordlist-hero__copy">
            <p className="eyebrow">Tabula verborum</p>
            <h1>My wordlist</h1>
            <p className="lead wordlist-hero__lead">
              Every word from every lesson you have marked as learned — the
              vocabulary it prints and every word in its reading — plus any
              word you save while reading. Mark a chapter and its words enter
              the list; unmark it and they leave again. Words you already know
              can be set aside.
            </p>
            <div className="wordlist-hero__actions">
              <Link className="btn btn--primary" to={primaryAction.to}>
                {primaryAction.label}
              </Link>
              <Link className="btn btn--ghost" to="/iter">
                Continue the course
              </Link>
            </div>
          </div>

          <div className="wordlist-hero__progress">
            <p className="wordlist-hero__number">{stats.total}</p>
            <p className="wordlist-hero__label">
              words from {contributingChapters} learned{' '}
              {contributingChapters === 1 ? 'lesson' : 'lessons'}
              {savedCount > 0 ? ` · ${savedCount} saved` : ''}
            </p>
            <div
              className="progress"
              role="progressbar"
              aria-label="Words reviewed"
              aria-valuenow={stats.percentReviewed}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="progress__fill"
                style={{ width: `${stats.percentReviewed}%` }}
              />
            </div>
            <p className="wordlist-hero__detail">
              {stats.reviewed} reviewed · {stats.due} due · {stats.new} new
            </p>
          </div>
        </header>

        <dl className="wordlist-band">
          <div>
            <dt>Due now</dt>
            <dd>{stats.due}</dd>
          </div>
          <div>
            <dt>New</dt>
            <dd>{stats.new}</dd>
          </div>
          <div>
            <dt>Learning</dt>
            <dd>{stats.learning}</dd>
          </div>
          <div>
            <dt>Mature</dt>
            <dd>{stats.mature}</dd>
          </div>
        </dl>

        {words.length > 0 && (
          <>
            <div className="wordlist-tools">
              <label className="wordlist-field">
                <span className="wordlist-field__label">
                  Search Latin or English
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="e.g. rīpa, river, caput…"
                  autoComplete="off"
                />
              </label>

              <label className="wordlist-field">
                <span className="wordlist-field__label">Book</span>
                <select
                  value={book}
                  onChange={(event) => setBook(event.target.value)}
                >
                  <option value="all">All books ({words.length})</option>
                  {sourceBooks.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.shortTitle} ({bookCounts.get(item.id) || 0})
                    </option>
                  ))}
                </select>
              </label>

              <label className="wordlist-field">
                <span className="wordlist-field__label">Order</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option value={option.key} key={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <nav className="wordlist-filters" aria-label="Filter by review status">
              {STATUS_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.key}
                  className={`wordlist-filter${status === option.key ? ' is-active' : ''}`}
                  onClick={() => setStatus(option.key)}
                  aria-pressed={status === option.key}
                >
                  {option.label}
                  <span className="wordlist-filter__count">
                    {filterCount(statusCounts, option.key)}
                  </span>
                </button>
              ))}
            </nav>

            <p className="wordlist-count">
              <strong>{filtered.length.toLocaleString()}</strong>{' '}
              {filtered.length === 1 ? 'word' : 'words'}
              {book !== 'all' && (
                <>
                  {' '}in{' '}
                  <strong>
                    {sourceBooks.find((item) => item.id === book)?.shortTitle}
                  </strong>
                </>
              )}
              {status !== 'all' && (
                <>
                  {' '}·{' '}
                  <strong>
                    {STATUS_OPTIONS.find((item) => item.key === status)?.label}
                  </strong>
                </>
              )}
              {query && <> matching “{query}”</>}
            </p>

            <div className="wordlist-list">
              {filtered.slice(0, visible).map((word) => (
                <WordRow
                  key={word.key}
                  word={word}
                  state={stateFor(review, word.key)}
                  now={now}
                />
              ))}
            </div>

            {filtered.length > visible && (
              <div className="wordlist-more">
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
              <div className="wordlist-no-match">
                <p className="muted">No words match these filters.</p>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setQuery('')
                    setBook('all')
                    setStatus('all')
                  }}
                >
                  Clear the filters
                </button>
              </div>
            )}
          </>
        )}

        {words.length === 0 && (
          <EmptyWordlist studiedChapters={studiedChapters} />
        )}

        <div className="wordlist-notes">
          <p>
            <strong>The list follows your progress.</strong> Marking a chapter
            adds every word it prints and every word found in its reading;
            unmarking it removes those words. Your review history stays on this
            device, so a word returns with its place if you come back to the
            chapter.
          </p>
          <p>
            <strong>Where the words come from.</strong> Every book in the
            library: the vocabulary printed in the course books and companions,
            plus every dictionary lemma found in the readings of the chapters
            you mark. Names and rare one-off words are included.
          </p>
        </div>
      </div>
    </section>
  )
}
