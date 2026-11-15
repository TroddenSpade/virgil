import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWordlist } from '../hooks/useWordlist.js'
import {
  NEW_PER_SESSION_OPTIONS,
  RATINGS,
  buildSession,
  formatDuration,
  intervalLabel,
  isDue,
  isNew,
  rateReview,
  stateFor,
  statusOf,
} from '../lib/review.js'
import { sourceLabel } from '../lib/wordlist.js'
import { wordHref } from '../lib/dictionary.js'

const MODES = [
  {
    key: 'mixed',
    label: 'Mixed',
    hint: 'Due words first, then new ones.',
  },
  {
    key: 'due',
    label: 'Due only',
    hint: 'Words whose interval has come round.',
  },
  {
    key: 'new',
    label: 'New only',
    hint: 'Words you have not met yet.',
  },
]

const KEY_RATINGS = {
  1: 'again',
  2: 'hard',
  3: 'good',
  4: 'easy',
}

function ModeButton({ item, active, count, disabled, onSelect }) {
  return (
    <button
      type="button"
      className={`review-mode${active ? ' is-active' : ''}`}
      onClick={() => onSelect(item.key)}
      disabled={disabled}
      aria-pressed={active}
    >
      <span className="review-mode__label">{item.label}</span>
      <span className="review-mode__count">{count}</span>
      <span className="review-mode__hint">{item.hint}</span>
    </button>
  )
}

export default function WordlistReview() {
  const {
    words,
    stats,
    review,
    setReview,
    now,
  } = useWordlist()

  const [searchParams] = useSearchParams()
  const requestedMode = searchParams.get('mode')
  const initialMode = ['mixed', 'due', 'new'].includes(requestedMode)
    ? requestedMode
    : 'mixed'
  const nextParam = searchParams.get('next')
  const nextHref =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : ''
  const nextLabel = searchParams.get('nextLabel') || 'the next reading'
  const returnParam = searchParams.get('returnTo')
  const returnTo =
    returnParam && returnParam.startsWith('/') && !returnParam.startsWith('//')
      ? returnParam
      : ''

  const [mode, setMode] = useState(initialMode)
  const [newPerSession, setNewPerSession] = useState(
    review.settings?.newPerSession || 20,
  )
  const [phase, setPhase] = useState('setup')
  const [queue, setQueue] = useState([])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  })
  const [ratings, setRatings] = useState(0)
  const [reviewedKeys, setReviewedKeys] = useState(() => new Set())
  const [sessionMode, setSessionMode] = useState('mixed')
  const promptRef = useRef(null)
  const answerRef = useRef(null)

  // A new card should take keyboard focus, so screen readers announce the
  // word and Space/Enter keeps working without hunting for the button.
  useEffect(() => {
    if (phase === 'session') promptRef.current?.focus()
  }, [phase, index])

  // The reverse when the answer appears: focus the revealed text so it is
  // read out, while the 1–4 keys grade directly.
  useEffect(() => {
    if (phase === 'session' && revealed) answerRef.current?.focus()
  }, [phase, revealed])

  useEffect(() => {
    if (requestedMode && ['mixed', 'due', 'new'].includes(requestedMode)) {
      setMode(requestedMode)
    }
  }, [requestedMode])

  const due = useMemo(
    () => words.filter((word) => isDue(stateFor(review, word.key), now)),
    [words, review, now],
  )
  const fresh = useMemo(
    () => words.filter((word) => isNew(stateFor(review, word.key))),
    [words, review],
  )
  const dueCount = due.length
  const newCount = fresh.length
  const newThisSession = Math.min(newCount, newPerSession)

  const modeCount = (key) => {
    if (key === 'due') return dueCount
    if (key === 'new') return newThisSession
    return dueCount + newThisSession
  }

  const available = modeCount(mode)

  const nextDue = useMemo(() => {
    const times = words
      .map((word) => stateFor(review, word.key))
      .filter((state) => state && state.seen > 0)
      .map((state) => state.due)
      .filter((time) => Number.isFinite(time))
    return times.length ? Math.min(...times) : null
  }, [words, review])

  const current = queue[index] || null
  const currentState = current ? stateFor(review, current.key) : null
  const currentStatus = current
    ? statusOf(currentState, now)
    : { key: 'new', label: 'New' }
  const remaining = Math.max(0, queue.length - index)
  const progressPercent =
    ratings + remaining > 0
      ? Math.round((ratings / (ratings + remaining)) * 100)
      : 0

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [phase])

  const start = (selectedMode = mode) => {
    const nextQueue = buildSession(
      words,
      review,
      selectedMode,
      Date.now(),
      newPerSession,
    )
    setSessionMode(selectedMode)
    setQueue(nextQueue)
    setIndex(0)
    setRevealed(false)
    setResults({ again: 0, hard: 0, good: 0, easy: 0 })
    setRatings(0)
    setReviewedKeys(new Set())
    setPhase(nextQueue.length ? 'session' : 'done')
  }

  const rate = useCallback(
    (rating) => {
      if (!current || !revealed) return
      const nowValue = Date.now()
      setReview((previous) =>
        rateReview(previous, current.key, rating, nowValue),
      )
      setResults((previous) => ({
        ...previous,
        [rating]: previous[rating] + 1,
      }))
      setRatings((value) => value + 1)
      setReviewedKeys((previous) => {
        const next = new Set(previous)
        next.add(current.key)
        return next
      })

      const nextQueue =
        rating === 'again' ? [...queue, current] : queue
      setQueue(nextQueue)
      if (index + 1 >= nextQueue.length) {
        setPhase('done')
        setRevealed(false)
      } else {
        setIndex(index + 1)
        setRevealed(false)
      }
    },
    [current, revealed, setReview, queue, index],
  )

  useEffect(() => {
    if (phase !== 'session') return undefined
    const onKey = (event) => {
      const tag = event.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (!revealed) {
        if (event.key === ' ' || event.key === 'Enter') {
          // Let a focused button or link do its own job (Reveal, End
          // session); elsewhere Space/Enter reveals the card.
          if (tag === 'BUTTON' || tag === 'A') return
          event.preventDefault()
          setRevealed(true)
        }
        return
      }

      const rating = KEY_RATINGS[event.key]
      if (rating) {
        event.preventDefault()
        rate(rating)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, revealed, rate])

  const changeNewLimit = (value) => {
    const limit = Number(value)
    setNewPerSession(limit)
    setReview((previous) => ({
      ...previous,
      settings: { ...previous.settings, newPerSession: limit },
    }))
  }

  if (phase === 'setup') {
    return (
      <section className="section review-page">
        <div className="container-narrow">
          <nav className="dict-crumb">
            <Link to={returnTo || '/wordlist'}>{returnTo ? '← Today' : '← Wordlist'}</Link>
            <span aria-hidden="true">·</span>
            <span>Review</span>
          </nav>

          <header className="review-hero">
            <p className="eyebrow">Exercitium</p>
            <h1>Review</h1>
            <p className="lead">
              Words return at widening intervals: tomorrow, then in three days,
              a week, a fortnight, a month, and beyond. A word you miss comes
              back in this session; a word you know well waits longer.
            </p>
            {nextHref && (
              <p className="review-guided">
                <span className="review-guided__label">Today’s session</span>{' '}
                Reviews first, then <strong>{nextLabel}</strong>.
              </p>
            )}
            {returnTo && !nextHref && (
              <p className="review-guided">
                <span className="review-guided__label">Today’s session</span>{' '}
                Reviews first, then back to Hodiē for the form drill.
              </p>
            )}
          </header>

          {words.length === 0 ? (
            <section className="review-empty card">
              <p className="eyebrow">Nōndum verba</p>
              <h2>Your wordlist is empty.</h2>
              <p>
                Mark a chapter as learned and its printed vocabulary will join
                the list. Then come back here to review it.
              </p>
              <div className="review-empty__actions">
                <Link className="btn btn--primary" to="/iter">
                  Open the itinerary →
                </Link>
                <Link className="btn btn--ghost" to="/wordlist">
                  Back to the wordlist
                </Link>
              </div>
            </section>
          ) : (
            <div className="review-setup card">
              <div className="review-setup__head">
                <div>
                  <p className="eyebrow">Today</p>
                  <h2>
                    {dueCount
                      ? `${dueCount} ${dueCount === 1 ? 'word' : 'words'} due`
                      : 'Nothing due'}
                  </h2>
                  <p className="muted">
                    {newCount} new{' '}
                    {newCount === 1 ? 'word' : 'words'} in the list ·{' '}
                    {stats.total} words in all
                  </p>
                </div>
                <div className="review-setup__numbers" aria-hidden="true">
                  <div>
                    <span>{dueCount}</span>
                    <small>due</small>
                  </div>
                  <div>
                    <span>{newCount}</span>
                    <small>new</small>
                  </div>
                </div>
              </div>

              <div
                className="review-modes"
                role="group"
                aria-label="Session type"
              >
                {MODES.map((item) => (
                  <ModeButton
                    key={item.key}
                    item={item}
                    active={mode === item.key}
                    count={modeCount(item.key)}
                    disabled={modeCount(item.key) === 0}
                    onSelect={setMode}
                  />
                ))}
              </div>

              <div className="review-options">
                <label className="review-limit">
                  <span>New words this session</span>
                  <select
                    value={newPerSession}
                    onChange={(event) => changeNewLimit(event.target.value)}
                  >
                    {NEW_PER_SESSION_OPTIONS.map((option) => (
                      <option value={option} key={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="review-options__note">
                  Due words are never capped. New words are introduced in the
                  order you met their chapters.
                </p>
              </div>

              <button
                type="button"
                className="btn btn--primary review-start"
                onClick={() => start(mode)}
                disabled={available === 0}
              >
                {available > 0
                  ? `Begin ${mode === 'mixed' ? 'mixed' : mode} session · ${available} →`
                  : 'Nothing to review'}
              </button>

              <p className="review-explainer">
                <strong>Again</strong> brings a word back in this session.{' '}
                <strong>Hard</strong> keeps it at its level for a day.{' '}
                <strong>Good</strong> moves it forward.{' '}
                <strong>Easy</strong> moves it two steps ahead.
              </p>

              {dueCount === 0 && newCount === 0 && (
                <p className="review-caught-up">
                  All caught up.{' '}
                  {nextDue
                    ? `The next word returns in ${formatDuration(nextDue - now)}.`
                    : 'Mark a chapter to add more words.'}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    )
  }

  if (phase === 'done') {
    return (
      <section className="section review-page">
        <div className="container-narrow">
          <nav className="dict-crumb">
            <Link to={returnTo || '/wordlist'}>{returnTo ? '← Today' : '← Wordlist'}</Link>
            <span aria-hidden="true">·</span>
            <span>Review</span>
          </nav>

          <div className="review-done card">
            <p className="eyebrow">Finis</p>
            <h1>
              {ratings
                ? nextHref || returnTo
                  ? 'Today’s reviews complete'
                  : 'Session complete'
                : 'Nothing due'}
            </h1>
            <p className="lead">
              {ratings
                ? `You reviewed ${reviewedKeys.size} ${
                    reviewedKeys.size === 1 ? 'word' : 'words'
                  } in ${ratings} ${ratings === 1 ? 'pass' : 'passes'}.`
                : 'There are no words waiting for review just now.'}
            </p>

            {ratings > 0 && (
              <dl className="review-done__stats">
                <div>
                  <dt>Again</dt>
                  <dd>{results.again}</dd>
                </div>
                <div>
                  <dt>Hard</dt>
                  <dd>{results.hard}</dd>
                </div>
                <div>
                  <dt>Good</dt>
                  <dd>{results.good}</dd>
                </div>
                <div>
                  <dt>Easy</dt>
                  <dd>{results.easy}</dd>
                </div>
              </dl>
            )}

            <p className="review-done__next">
              {dueCount > 0
                ? `${dueCount} ${dueCount === 1 ? 'word is' : 'words are'} due now.`
                : nextDue
                  ? `The next word returns in ${formatDuration(nextDue - now)}.`
                  : 'Mark a chapter to add more words to the list.'}
            </p>

            {nextHref && (
              <div className="review-guided-next">
                <p className="eyebrow">Proxima statiō</p>
                <h2>{nextLabel}</h2>
                <Link className="btn btn--primary" to={nextHref}>
                  Continue to today’s reading →
                </Link>
              </div>
            )}

            <div className="review-done__actions">
              {returnTo && (
                <Link className="btn btn--primary" to={returnTo}>
                  Back to today’s session →
                </Link>
              )}
              <button
                type="button"
                className={`btn ${nextHref || returnTo ? 'btn--ghost' : 'btn--primary'}`}
                onClick={() => setPhase('setup')}
              >
                Plan another session
              </button>
              <Link className="btn btn--ghost" to="/wordlist">
                Back to the wordlist
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!current) {
    return (
      <section className="section review-page">
        <div className="container-narrow">
          <nav className="dict-crumb">
            <Link to={returnTo || '/wordlist'}>{returnTo ? '← Today' : '← Wordlist'}</Link>
          </nav>
          <p className="muted">There is no card to show.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="section review-page">
      <div className="container-narrow">
        <div className="review-session">
          <div className="review-session__head">
            <div>
              <p className="eyebrow">
                Review · {sessionMode === 'mixed' ? 'mixed' : sessionMode}
              </p>
              <p className="review-session__count">
                {remaining} {remaining === 1 ? 'card' : 'cards'} remaining
              </p>
            </div>
            <button
              type="button"
              className="back-link review-end"
              onClick={() => setPhase('done')}
            >
              End session
            </button>
          </div>

          <div
            className="progress review-progress"
            role="progressbar"
            aria-label="Session progress"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="progress__fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <article className="review-card">
            <div className="review-card__meta">
              <span className={`word-status word-status--${currentStatus.key}`}>
                {currentStatus.label}
              </span>
              {current.firstSource && (
                <span className="review-card__source">
                  {sourceLabel(current.firstSource)}
                </span>
              )}
            </div>

            <div className="review-card__prompt">
              <p
                className="review-card__latin latin"
                lang="la"
                tabIndex={-1}
                ref={promptRef}
              >
                {current.headword}
              </p>
              {current.principal && (
                <p className="review-card__principal latin" lang="la">
                  {current.principal}
                </p>
              )}
            </div>

            <p className="visually-hidden" role="status">
              {`Card ${ratings + 1} of ${ratings + remaining}`}
            </p>

            {!revealed ? (
              <button
                type="button"
                className="btn btn--primary review-reveal"
                onClick={() => setRevealed(true)}
              >
                Reveal answer
              </button>
            ) : (
              <div
                className="review-card__back"
                ref={answerRef}
                tabIndex={-1}
              >
                <dl className="review-senses">
                  {current.senseGroups.length > 0 ? (
                    current.senseGroups.map((group) => (
                      <div key={group.kind}>
                        <dt>{group.label}</dt>
                        <dd>{group.all.join('; ')}</dd>
                      </div>
                    ))
                  ) : (
                    <div>
                      <dt>sense</dt>
                      <dd>No gloss recorded.</dd>
                    </div>
                  )}
                </dl>

                <div className="review-card__foot">
                  <div className="review-card__sources">
                    <span className="review-card__foot-label">
                      In your learned chapters
                    </span>
                    {current.sources.map((source) => (
                      <Link
                        key={`${source.bookId}:${source.number}`}
                        to={source.href}
                      >
                        {sourceLabel(source)}
                      </Link>
                    ))}
                  </div>
                  <Link
                    className="review-card__dictionary"
                    to={wordHref(current.headword)}
                  >
                    Open in the lexicon →
                  </Link>
                </div>
              </div>
            )}
          </article>

          {revealed ? (
            <>
              <div className="review-actions">
                {RATINGS.map((rating) => (
                  <button
                    type="button"
                    key={rating.key}
                    className={`review-rate review-rate--${rating.tone}`}
                    onClick={() => rate(rating.key)}
                  >
                    <span>{rating.label}</span>
                    <small>{intervalLabel(rating.key, currentState)}</small>
                  </button>
                ))}
              </div>
              <p className="review-keys">1–4 to grade</p>
            </>
          ) : (
            <p className="review-keys">Space or Enter to reveal</p>
          )}

          <p className="review-session__hint">
            Your answer is saved after every card. You can end the session at
            any time.
          </p>
        </div>
      </div>
    </section>
  )
}
