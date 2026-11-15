import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from '../lib/account.jsx'
import {
  progressFingerprint,
  readLocalProgress,
  readBookProgress,
  summarizeProgress,
} from '../lib/progress.js'
import { iterStages, iterLessonCount } from '../data/learning-path.generated.js'
import { DAILY_TARGET, habitStats } from '../lib/review.js'
import { useWordlist } from '../hooks/useWordlist.js'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

function formatDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function Snapshot({ eyebrow, tag, tone, total, totalChapters, percent, stamp, empty }) {
  return (
    <article className="profile-snapshot card">
      <div className="profile-snapshot__head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3 className="profile-snapshot__title">
            {total ? `${total} chapters learned` : empty}
          </h3>
        </div>
        <span className={`tag ${tone || ''}`}>{tag}</span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label={`${eyebrow} progress`}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="profile-snapshot__stamp">
        {total} of {totalChapters} chapters · {percent}%
      </p>
      {stamp && <p className="profile-snapshot__stamp">{stamp}</p>}
    </article>
  )
}

export default function Profile() {
  const {
    configured,
    authState,
    email,
    error,
    operation,
    remote,
    remoteLoading,
    lastSyncedAt,
    signIn,
    signOut,
    saveProgress,
    fetchProgress,
    deleteRemote,
  } = useAccount()

  const [address, setAddress] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const [revision, setRevision] = useState(0)
  const [confirmLoad, setConfirmLoad] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const local = useMemo(() => readLocalProgress(), [revision])
  const localSummary = useMemo(() => summarizeProgress(local), [local])
  const {
    stats: wordStats,
    studiedChapters,
    review,
    now,
  } = useWordlist()
  const habit = useMemo(
    () => habitStats(review, now, DAILY_TARGET),
    [review, now],
  )
  const remoteSummary = useMemo(
    () => (remote ? summarizeProgress(remote.progress) : null),
    [remote],
  )
  const inSync = Boolean(remote) && progressFingerprint(local) === progressFingerprint(remote.progress)
  const signedIn = authState === 'signed-in'
  const remoteDate = formatDate(remote?.updatedAt)
  const syncedDate = formatDate(lastSyncedAt)

  const startedBooks = localSummary.books.filter((book) => book.learned > 0).length
  const stagesStarted = useMemo(() => {
    const path = new Set()
    for (const stage of iterStages) {
      if (stage.lessons.some((lesson) => readBookProgress(lesson.bookId).includes(lesson.number))) {
        path.add(stage.id)
      }
    }
    return path.size
  }, [revision])

  const path = useMemo(() => {
    const progress = new Map()
    for (const bookId of new Set(iterStages.flatMap((stage) => stage.lessons.map((lesson) => lesson.bookId)))) {
      progress.set(bookId, new Set(readBookProgress(bookId)))
    }
    const isDone = (lesson) => progress.get(lesson.bookId)?.has(lesson.number) ?? false

    let doneCount = 0
    let next = null
    const stages = iterStages.map((stage, index) => {
      const learned = stage.lessons.filter(isDone).length
      if (!next) {
        const lesson = stage.lessons.find((item) => !isDone(item))
        if (lesson) next = { lesson, stage, index }
      }
      doneCount += learned
      return {
        ...stage,
        index,
        learned,
        percent: stage.lessonCount ? Math.round((learned / stage.lessonCount) * 100) : 0,
      }
    })

    return {
      stages,
      doneCount,
      percent: iterLessonCount ? Math.round((doneCount / iterLessonCount) * 100) : 0,
      next,
    }
  }, [revision])

  const reviewTarget = wordStats.due > 0
    ? { to: '/wordlist/review?mode=due', label: `Review ${wordStats.due} due →` }
    : wordStats.new > 0
      ? { to: '/wordlist/review?mode=new', label: `Learn ${wordStats.new} new →` }
      : { to: '/wordlist/review', label: 'Open review →' }

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1)
    const onStorage = (event) => {
      if (event.type === 'storage' || event.detail?.key?.startsWith('virgil:progress:')) refresh()
    }
    window.addEventListener('virgil:storage', onStorage)
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('virgil:storage', onStorage)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const status = (() => {
    if (!configured) return { tone: 'muted', label: 'Local only' }
    if (authState === 'loading') return { tone: 'busy', label: 'Checking session' }
    if (!signedIn) return { tone: 'muted', label: 'Local only' }
    if (operation === 'saving') return { tone: 'busy', label: 'Saving' }
    if (operation === 'fetching') return { tone: 'busy', label: 'Loading account copy' }
    if (operation === 'deleting') return { tone: 'busy', label: 'Deleting account copy' }
    if (error) return { tone: 'error', label: 'Connection issue' }
    if (remoteLoading) return { tone: 'busy', label: 'Checking account' }
    if (!remote) return { tone: 'warn', label: 'Not saved yet' }
    if (inSync) return { tone: 'ok', label: 'In sync' }
    return { tone: 'warn', label: 'Local changes' }
  })()

  const handleSignIn = async (event) => {
    event.preventDefault()
    if (!address.trim()) return
    setBusy(true)
    setNotice(null)
    const result = await signIn(address)
    setBusy(false)
    setNotice(
      result.ok
        ? {
            tone: 'ok',
            text: `Check ${address.trim()} for a sign-in link. It may take a minute to arrive.`,
          }
        : { tone: 'error', text: result.error || 'Could not send the sign-in link.' },
    )
  }

  const handleSave = async () => {
    const result = await saveProgress()
    if (result.ok) {
      setRevision((value) => value + 1)
      setNotice({ tone: 'ok', text: 'Progress saved to your account.' })
    } else {
      setNotice({ tone: 'error', text: result.error || 'Could not save to the account.' })
    }
  }

  const handleFetch = async () => {
    const result = await fetchProgress()
    setConfirmLoad(false)
    if (result.ok) {
      setRevision((value) => value + 1)
      setNotice({ tone: 'ok', text: 'Account copy loaded onto this device.' })
    } else {
      setNotice({ tone: 'error', text: result.error || 'Could not load the account copy.' })
    }
  }

  const handleDelete = async () => {
    const result = await deleteRemote()
    setConfirmDelete(false)
    if (result.ok) {
      setNotice({ tone: 'ok', text: 'Saved copy deleted. This device still has your progress.' })
    } else {
      setNotice({ tone: 'error', text: result.error || 'Could not delete the saved copy.' })
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setConfirmLoad(false)
    setConfirmDelete(false)
    setNotice({ tone: 'ok', text: 'Signed out. Your progress stays on this device.' })
  }

  return (
    <section className="section profile-page">
      <div className="container">
        <header className="profile-hero rise">
          <div className="profile-hero__status">
            <span className={`profile-pill profile-pill--${status.tone}`}>
              <span className="profile-pill__dot" />
              {status.label}
            </span>
          </div>

          <div className="profile-hero__copy">
            <h1 className="visually-hidden">Profile</h1>

            <section
              className="profile-habit profile-habit--hero"
              aria-labelledby="profile-habit-title"
            >
              <div className="profile-habit__head">
                <div>
                  <p className="eyebrow">Consuētūdō</p>
                  <h2 id="profile-habit-title">The daily habit</h2>
                </div>
                <p className={`profile-habit__streak${habit.streak > 0 ? ' is-live' : ''}`}>
                  <span className="profile-habit__streak-mark" aria-hidden="true">✦</span>
                  {habit.streak > 0 ? `${habit.streak}-day streak` : 'No streak yet'}
                </p>
              </div>

              <div className="profile-habit__body">
                <div className="profile-habit__today">
                  <p className="profile-habit__today-line">
                    <span className="profile-habit__today-label">Hodiē</span>
                    <span className="profile-habit__today-dot" aria-hidden="true">·</span>
                    <span className="profile-habit__today-count">
                      {habit.today} of {habit.target}
                    </span>
                  </p>
                  <p className="profile-habit__today-caption">reviews today</p>
                  <div
                    className="progress"
                    role="progressbar"
                    aria-label="Reviews today"
                    aria-valuenow={Math.min(habit.today, habit.target)}
                    aria-valuemin={0}
                    aria-valuemax={habit.target}
                    aria-valuetext={`${habit.today} of ${habit.target} reviews today`}
                  >
                    <div className="progress__fill" style={{ width: `${habit.percent}%` }} />
                  </div>
                  <p className="profile-habit__note">
                    {habit.today >= habit.target
                      ? 'Today’s target is met.'
                      : `${habit.target - habit.today} ${
                          habit.target - habit.today === 1 ? 'review' : 'reviews'
                        } to today’s target.`}
                  </p>
                </div>

                <div
                  className="profile-habit__week"
                  role="group"
                  aria-label="Reviews over the last seven days"
                >
                  {habit.week.map((day) => (
                    <div
                      className={`profile-habit__day${day.isToday ? ' is-today' : ''}`}
                      key={day.key}
                      title={`${day.label}: ${day.count} ${
                        day.count === 1 ? 'review' : 'reviews'
                      }`}
                    >
                      <span className="profile-habit__bar" aria-hidden="true">
                        <span
                          className="profile-habit__bar-fill"
                          style={{ height: `${day.height}%` }}
                        />
                      </span>
                      <span className="profile-habit__day-label">{day.label}</span>
                      <span className="profile-habit__day-count">{day.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="profile-hero__next">
              <p className="eyebrow">Proxima statiō</p>
              {path.next ? (
                <>
                  <h2 className="profile-hero__next-title">
                    {path.next.lesson.bookShort} · {path.next.lesson.roman}
                  </h2>
                  <p className="profile-hero__next-lesson">{path.next.lesson.title}</p>
                  <p className="profile-hero__next-stage">
                    Stage {ROMAN[path.next.index] || path.next.index + 1} ·{' '}
                    <span className="latin">{path.next.stage.latin}</span> — {path.next.stage.title}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="profile-hero__next-title">Begin the course</h2>
                  <p className="profile-hero__next-lesson">
                    Open the first lesson of the itinerary and start reading.
                  </p>
                </>
              )}

              <div className="profile-hero__actions">
                {path.next ? (
                  <Link className="btn btn--primary" to={path.next.lesson.href}>
                    Continue · {path.next.lesson.bookShort} {path.next.lesson.roman} →
                  </Link>
                ) : (
                  <Link className="btn btn--primary" to="/library">
                    Begin the course →
                  </Link>
                )}
                <Link className="btn btn--ghost" to="/iter">
                  Open the itinerary
                </Link>
              </div>
            </div>
          </div>

          <div className="profile-hero__progress">
            <p className="eyebrow">Tabula studiōrum</p>
            <div className="profile-hero__progress-head">
              <h2 className="profile-hero__progress-title">Your progress</h2>
            </div>
            <p className="profile-hero__percent">
              {localSummary.percent}
              <span>%</span>
            </p>
            <p className="profile-hero__label">of the library read</p>
            <div
              className="progress"
              role="progressbar"
              aria-label="Library read"
              aria-valuenow={localSummary.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="progress__fill" style={{ width: `${localSummary.percent}%` }} />
            </div>
            <p className="profile-hero__detail">
              {localSummary.total} of {localSummary.totalChapters} chapters · {startedBooks} books begun
            </p>

            <div className="profile-hero__wordlist">
              <p className="eyebrow">Tabula verborum</p>
              <div className="profile-hero__wordlist-head">
                <h2 className="profile-hero__wordlist-title">Your wordlist</h2>
                {wordStats.total > 0 && (
                  <span className="profile-hero__wordlist-percent">
                    {wordStats.percentReviewed}% reviewed
                  </span>
                )}
              </div>

              {wordStats.total === 0 ? (
                <>
                  <p className="profile-hero__wordlist-note">
                    {studiedChapters === 0
                      ? 'Mark a chapter as learned and every word from it joins the list.'
                      : 'The lessons you have marked so far contain no indexed words.'}
                  </p>
                  <Link
                    className="back-link"
                    to={studiedChapters === 0 ? '/iter' : '/wordlist'}
                  >
                    {studiedChapters === 0 ? 'Open the itinerary →' : 'Open the wordlist →'}
                  </Link>
                </>
              ) : (
                <>
                  <p className="profile-hero__wordlist-number">
                    {wordStats.total.toLocaleString()}
                    <span> {wordStats.total === 1 ? 'word' : 'words'}</span>
                  </p>

                  <div
                    className="progress"
                    role="progressbar"
                    aria-label="Words reviewed"
                    aria-valuenow={wordStats.percentReviewed}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="progress__fill"
                      style={{ width: `${wordStats.percentReviewed}%` }}
                    />
                  </div>

                  <dl className="profile-hero__wordlist-stats">
                    <div>
                      <dt>Due now</dt>
                      <dd>{wordStats.due}</dd>
                    </div>
                    <div>
                      <dt>New</dt>
                      <dd>{wordStats.new}</dd>
                    </div>
                    <div>
                      <dt>Learning</dt>
                      <dd>{wordStats.learning}</dd>
                    </div>
                    <div>
                      <dt>Mature</dt>
                      <dd>{wordStats.mature}</dd>
                    </div>
                  </dl>

                  <div className="profile-hero__wordlist-actions">
                    <Link className="btn btn--primary btn--sm" to={reviewTarget.to}>
                      {reviewTarget.label}
                    </Link>
                    <Link className="back-link" to="/wordlist">
                      All words →
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <dl className="profile-band">
          <div>
            <dt>Chapters</dt>
            <dd>{localSummary.total}</dd>
          </div>
          <div>
            <dt>Books begun</dt>
            <dd>
              {startedBooks}
              <span> / {localSummary.books.length}</span>
            </dd>
          </div>
          <div>
            <dt>Stages</dt>
            <dd>
              {stagesStarted}
              <span> / {path.stages.length}</span>
            </dd>
          </div>
          <div>
            <dt>Itinerary</dt>
            <dd>{path.percent}%</dd>
          </div>
        </dl>

        <div className="profile-layout">
          <div className="profile-main">
            <section className="profile-section">
              <div className="profile-section__head">
                <div>
                  <p className="eyebrow">Iter</p>
                  <h2>The road</h2>
                </div>
                <Link className="back-link" to="/iter">
                  Full itinerary →
                </Link>
              </div>
              <div className="profile-stages">
                {path.stages.map((stage, index) => (
                  <Link className="profile-stage card" to={`/iter#${stage.id}`} key={stage.id}>
                    <span className="profile-stage__num" aria-hidden="true">
                      {ROMAN[index] || index + 1}
                    </span>
                    <span className="profile-stage__body">
                      <span className="profile-stage__latin latin">{stage.latin}</span>
                      <span className="profile-stage__title">{stage.title}</span>
                      <span className="progress">
                        <span className="progress__fill" style={{ width: `${stage.percent}%` }} />
                      </span>
                    </span>
                    <span className="profile-stage__count">
                      {stage.learned}/{stage.lessonCount}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="profile-section">
              <div className="profile-section__head">
                <div>
                  <p className="eyebrow">Bibliotheca</p>
                  <h2>Your books</h2>
                </div>
                <Link className="back-link" to="/library">
                  Open the library →
                </Link>
              </div>
              <div className="profile-books">
                {localSummary.books.map((book) => (
                  <Link className="profile-book card" to={`/library/${book.slug}`} key={book.id}>
                    <span className="profile-book__head">
                      <span className="profile-book__title">{book.shortTitle}</span>
                      <span className="profile-book__percent">{book.percent}%</span>
                    </span>
                    <span className="progress">
                      <span className="progress__fill" style={{ width: `${book.percent}%` }} />
                    </span>
                    <span className="profile-book__meta">
                      {book.learned} / {book.chapterCount} chapters
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="profile-section">
              <div className="profile-section__head">
                <div>
                  <p className="eyebrow">Account</p>
                  <h2>Keep a copy</h2>
                </div>
                <span className={`profile-pill profile-pill--${status.tone}`}>
                  <span className="profile-pill__dot" />
                  {status.label}
                </span>
              </div>
              <p className="muted profile-account__intro">
                Sign in with an email link to keep a copy of your learned chapters in Supabase and
                load it on another device. Without an account, everything still works offline.
              </p>

              {!configured ? (
                <section className="profile-panel card">
                  <p className="eyebrow">Sync is off in this build</p>
                  <h3>Local-first by default.</h3>
                  <p>
                    Your progress lives on this device, and the whole course works offline. To
                    enable email sign-in, set <code>VITE_SUPABASE_URL</code> and{' '}
                    <code>VITE_SUPABASE_ANON_KEY</code> before building. The README has the exact
                    Supabase setup steps.
                  </p>
                  <p className="small muted">
                    Nothing is lost by waiting: your learned chapters are already saved in this
                    browser.
                  </p>
                </section>
              ) : authState === 'loading' ? (
                <section className="profile-panel card">
                  <p className="eyebrow">Account</p>
                  <h3>Checking your session…</h3>
                  <p className="small muted">This will only take a moment.</p>
                </section>
              ) : !signedIn ? (
                <section className="profile-panel card">
                  <div className="profile-panel__head">
                    <div>
                      <p className="eyebrow">Email sign-in</p>
                      <h3>No password. Just a link.</h3>
                    </div>
                    <span className="profile-panel__mark" aria-hidden="true">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.3 9.2 4 4 0 0 0 6.5 17h11Z" />
                        <path d="M9 14h6" />
                      </svg>
                    </span>
                  </div>
                  <p>
                    Enter the email you want to use. Supabase sends a one-time sign-in link; opening
                    it brings you back here, signed in. There is no password to remember.
                  </p>
                  <form className="profile-form" onSubmit={handleSignIn}>
                    <label className="profile-field" htmlFor="profile-email">
                      <span>Email address</span>
                      <input
                        id="profile-email"
                        type="email"
                        required
                        autoComplete="email"
                        inputMode="email"
                        placeholder="you@example.com"
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                      />
                    </label>
                    <button className="btn btn--primary" type="submit" disabled={busy}>
                      {busy ? 'Sending…' : 'Email me a sign-in link'}
                    </button>
                  </form>
                  {notice && (
                    <p
                      className={`profile-message profile-message--${notice.tone}`}
                      role={notice.tone === 'error' ? 'alert' : 'status'}
                    >
                      {notice.text}
                    </p>
                  )}
                  <p className="profile-note muted">
                    The link returns to this site. If it does not arrive, check spam or ask for
                    another one in a minute.
                  </p>
                </section>
              ) : (
                <section className="profile-panel card">
                  <div className="profile-identity">
                    <span className="profile-avatar" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <circle cx="12" cy="8" r="3.5" />
                        <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
                      </svg>
                    </span>
                    <div>
                      <p className="eyebrow">Signed in</p>
                      <h3>{email}</h3>
                      <p className="small muted">
                        {syncedDate
                          ? `Last synced ${syncedDate}.`
                          : remoteDate
                            ? `Account copy last saved ${remoteDate}.`
                            : 'No copy saved to the account yet.'}
                      </p>
                    </div>
                    <span className={`profile-pill profile-pill--${status.tone}`}>
                      <span className="profile-pill__dot" />
                      {status.label}
                    </span>
                  </div>

                  <div className="profile-actions">
                    <button
                      className="btn btn--primary"
                      type="button"
                      onClick={handleSave}
                      disabled={operation === 'saving'}
                    >
                      {operation === 'saving' ? 'Saving…' : 'Save to account'}
                    </button>
                    <button
                      className="btn btn--ghost"
                      type="button"
                      onClick={() => setConfirmLoad(true)}
                      disabled={!remote || inSync || operation === 'fetching'}
                    >
                      {operation === 'fetching' ? 'Loading…' : 'Load account copy'}
                    </button>
                    <button className="btn btn--ghost" type="button" onClick={handleSignOut}>
                      Sign out
                    </button>
                  </div>

                  {confirmLoad && remote && (
                    <div className="profile-confirm" role="alert">
                      <p>
                        <strong>Replace this device’s progress?</strong> The learned chapters here
                        will be overwritten by the account copy from {remoteDate || 'your account'}.
                      </p>
                      <div className="profile-actions">
                        <button
                          className="btn btn--primary btn--sm"
                          type="button"
                          onClick={handleFetch}
                          disabled={operation === 'fetching'}
                        >
                          {operation === 'fetching' ? 'Loading…' : 'Replace with account copy'}
                        </button>
                        <button
                          className="btn btn--ghost btn--sm"
                          type="button"
                          onClick={() => setConfirmLoad(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="profile-message profile-message--error" role="alert">
                      {error}
                    </p>
                  )}
                </section>
              )}

              {notice && configured && signedIn && (
                <p
                  className={`profile-message profile-message--${notice.tone}`}
                  role={notice.tone === 'error' ? 'alert' : 'status'}
                >
                  {notice.text}
                </p>
              )}

              <div className="profile-snapshots">
                <Snapshot
                  eyebrow="This device"
                  tag="Local"
                  total={localSummary.total}
                  totalChapters={localSummary.totalChapters}
                  percent={localSummary.percent}
                  empty="No progress yet"
                  stamp={
                    localSummary.total
                      ? 'Saved in this browser’s local storage.'
                      : 'Mark a chapter as learned to begin.'
                  }
                />
                <Snapshot
                  eyebrow="Your account"
                  tag={remoteLoading ? 'Checking' : remote ? 'Saved' : 'Empty'}
                  tone={remote ? 'tag--gold' : ''}
                  total={remoteSummary?.total || 0}
                  totalChapters={remoteSummary?.totalChapters || localSummary.totalChapters}
                  percent={remoteSummary?.percent || 0}
                  empty={remoteSummary ? 'The saved copy is empty' : 'No saved copy'}
                  stamp={
                    remote
                      ? `${remoteDate ? `Saved ${remoteDate}.` : 'Saved to the account.'}${inSync ? ' This device matches it.' : ''}`
                      : signedIn
                        ? 'Use “Save to account” to start a copy.'
                        : 'Sign in to see the copy saved to your account.'
                  }
                />
              </div>

              {signedIn && remote && (
                <section className="profile-danger card">
                  <div>
                    <p className="eyebrow">Saved copy</p>
                    <h3>Delete the account copy</h3>
                    <p className="small muted">
                      This removes the copy in Supabase. The progress on this device stays exactly
                      where it is.
                    </p>
                  </div>
                  {confirmDelete ? (
                    <div className="profile-actions">
                      <button
                        className="btn btn--danger btn--sm"
                        type="button"
                        onClick={handleDelete}
                        disabled={operation === 'deleting'}
                      >
                        {operation === 'deleting' ? 'Deleting…' : 'Yes, delete it'}
                      </button>
                      <button
                        className="btn btn--ghost btn--sm"
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn--ghost btn--sm"
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                    >
                      Delete saved copy
                    </button>
                  )}
                </section>
              )}
            </section>

            <p className="profile-back">
              <Link className="back-link" to="/library">
                ← Return to the library
              </Link>
            </p>
          </div>

          <aside className="profile-aside">
            <section className="profile-side-card card">
              <p className="eyebrow">At a glance</p>
              <dl className="profile-aside__stats">
                <div>
                  <dt>Chapters</dt>
                  <dd>{localSummary.total}</dd>
                </div>
                <div>
                  <dt>Books begun</dt>
                  <dd>{startedBooks}</dd>
                </div>
                <div>
                  <dt>Stages</dt>
                  <dd>
                    {stagesStarted}/{path.stages.length}
                  </dd>
                </div>
                <div>
                  <dt>Itinerary</dt>
                  <dd>{path.percent}%</dd>
                </div>
              </dl>
            </section>

            <section className="profile-side-card card">
              <p className="eyebrow">What travels</p>
              <ul className="profile-list">
                <li>
                  <strong>Learned chapters.</strong> Every book in the library, from Familia Romana
                  to the readers.
                </li>
                <li>
                  <strong>Not your preferences.</strong> Theme and install settings stay on this
                  device.
                </li>
              </ul>
            </section>

            <section className="profile-side-card card">
              <p className="eyebrow">Local first</p>
              <p>
                The reader never waits for the network. Saving to your account is a deliberate copy,
                and loading the account copy asks before it replaces this device’s progress.
              </p>
              <p className="small muted">
                The public Supabase key can only reach the signed-in user’s own row; row-level
                security protects the table.
              </p>
            </section>

            <Link className="profile-side-card card profile-side-link" to="/wordlist">
              <p className="eyebrow">After the lesson</p>
              <h3>Your wordlist</h3>
              <p>
                {wordStats.total
                  ? `${wordStats.total.toLocaleString()} words from your learned chapters${
                      wordStats.due ? ` · ${wordStats.due} due now` : ''
                    }. A short review keeps them with you.`
                  : 'Every word from the chapters you learn, gathered in one place for review.'}
              </p>
              <span>Open the wordlist →</span>
            </Link>

            <Link className="profile-side-card card profile-side-link" to="/dictionary">
              <p className="eyebrow">While you read</p>
              <h3>The Lexicon</h3>
              <p>Every form in the readings, with its sense, source chapter and example.</p>
              <span>Open the dictionary →</span>
            </Link>
          </aside>
        </div>
      </div>
    </section>
  )
}
