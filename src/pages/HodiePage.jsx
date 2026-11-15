import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLearningPath } from '../hooks/useLearningPath.js'
import { useWordlist } from '../hooks/useWordlist.js'
import { readPractice } from '../lib/paradigm-practice.js'
import { readBookProgress, setChapterDone } from '../lib/progress.js'
import { DAILY_TARGET, habitStats } from '../lib/review.js'
import {
  readHodieSession,
  writeHodieSession,
} from '../lib/hodie-session.js'

export default function HodiePage() {
  const { words, stats: wordStats, review, now } = useWordlist()
  const path = useLearningPath()
  const [session, setSession] = useState(() => readHodieSession())

  const habit = useMemo(
    () => habitStats(review, now, DAILY_TARGET),
    [review, now],
  )
  const practice = useMemo(() => readPractice(), [])

  // Pick one stored reading for the day, not the moving "next lesson".
  useEffect(() => {
    if (session.reading || !path.next?.lesson) return
    const lesson = path.next.lesson
    const reading = {
      bookId: lesson.bookId,
      number: lesson.number,
      href: lesson.href,
      label: `${lesson.bookShort} ${lesson.roman} — ${lesson.title}`,
      title: lesson.title,
      roman: lesson.roman,
      bookShort: lesson.bookShort,
    }
    setSession(writeHodieSession({ ...session, reading }))
  }, [path.next, session])

  const reviewsDone =
    wordStats.total === 0 ||
    habit.today >= habit.target ||
    (wordStats.due === 0 && wordStats.new === 0)

  const drillPick = useMemo(() => {
    const candidates = Object.entries(practice.lemmas || {})
      .map(([lemmaId, slots]) => {
        const values = Object.values(slots)
        return {
          lemmaId,
          wrong: values.reduce((sum, record) => sum + (record.wrong || 0), 0),
          seen: values.reduce((sum, record) => sum + (record.seen || 0), 0),
        }
      })
      .filter((item) => item.lemmaId && item.wrong > 0)
      .sort((a, b) => b.wrong - a.wrong || b.seen - a.seen)

    if (candidates[0]) return { lemmaId: candidates[0].lemmaId, weak: true }

    const fallback = words.find(
      (word) => word.key && word.kind !== 'phrase' && !word.key.startsWith('-'),
    )
    return fallback ? { lemmaId: fallback.key, weak: false } : null
  }, [practice, words])

  const drillLemma = drillPick?.lemmaId || null
  const drillIsWeak = Boolean(drillPick?.weak)

  const drillHref = drillLemma
    ? `/dictionary/${encodeURIComponent(drillLemma)}/paradigm/practice?count=5&returnTo=/hodie`
    : ''
  const drillDone = !drillLemma || Boolean(session.drill?.done)

  const reading = session.reading
  const readingDone =
    !reading || readBookProgress(reading.bookId).includes(reading.number)

  const complete = reviewsDone && drillDone && readingDone
  const hasWork = Boolean(reading) || Boolean(drillLemma) || wordStats.total > 0

  const action = (() => {
    if (!reviewsDone) {
      const label = wordStats.due
        ? `Review ${wordStats.due} due →`
        : wordStats.new
          ? `Learn ${Math.min(wordStats.new, DAILY_TARGET)} new →`
          : 'Open review →'
      return {
        to: '/wordlist/review?mode=mixed&returnTo=/hodie',
        label,
        hint: 'Reviews first.',
      }
    }
    if (drillLemma && !drillDone) {
      return {
        to: drillHref,
        label: 'Start the 5-form drill →',
        hint: drillIsWeak
          ? 'Five questions from the forms you miss most.'
          : 'Five forms from your wordlist to begin.',
      }
    }
    if (reading && !readingDone) {
      return {
        to: reading.href,
        label: 'Open today’s reading →',
        hint: reading.label,
      }
    }
    return null
  })()

  const markReadingDone = () => {
    if (!reading) return
    setChapterDone(reading.bookId, reading.number, true)
  }

  const steps = [
    {
      key: 'reviews',
      available: true,
      title: 'Reviews',
      done: reviewsDone,
      detail: `${habit.today} of ${habit.target} reviews today · ${wordStats.due} due · ${wordStats.new} new`,
    },
    {
      key: 'drill',
      title: 'Weak forms',
      done: Boolean(drillLemma) && drillDone,
      available: Boolean(drillLemma),
      detail: drillDone
        ? session.drill
          ? `${session.drill.correct} of ${session.drill.total} correct.`
          : 'No weak forms to drill yet.'
        : drillIsWeak
          ? 'Five questions from the forms you miss most.'
          : 'Five forms from your wordlist to begin.',
    },
    {
      key: 'reading',
      title: 'Reading',
      done: Boolean(reading) && readingDone,
      available: Boolean(reading),
      detail: reading
        ? reading.label
        : 'No next reading — the course is complete.',
    },
  ]

  const activeKey = steps.find((step) => step.available !== false && !step.done)?.key

  return (
    <section className="section hodie-page">
      <div className="container-narrow">
        <header className="hodie-hero">
          <p className="eyebrow">Hodiē</p>
          <h1>{complete ? 'Today’s session complete' : 'Today’s session'}</h1>
          <p className="lead">
            Reviews first, then a short form drill, then the next reading. Leave and
            come back whenever you like; the session remembers where you stopped.
          </p>
        </header>

        {!hasWork ? (
          <section className="hodie-empty card">
            <p className="eyebrow">Nōndum agenda</p>
            <h2>Nothing scheduled yet.</h2>
            <p className="lead">
              Mark a chapter as learned or save a word from a reading, and a daily
              session will appear here.
            </p>
            <div className="hodie-actions">
              <Link className="btn btn--primary" to="/iter">
                Open the itinerary →
              </Link>
              <Link className="btn btn--ghost" to="/library">
                Browse the library
              </Link>
            </div>
          </section>
        ) : (
          <>
            {complete ? (
              <section className="hodie-complete card">
                <p className="eyebrow">Finis</p>
                <h2>Everything for today is done.</h2>
                <dl className="hodie-summary">
                  <div>
                    <dt>Reviews</dt>
                    <dd>{habit.today}</dd>
                  </div>
                  <div>
                    <dt>Form drill</dt>
                    <dd>
                      {session.drill
                        ? `${session.drill.correct}/${session.drill.total}`
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt>Reading</dt>
                    <dd className="hodie-summary__reading">
                      {reading ? reading.label : 'Course complete'}
                    </dd>
                  </div>
                </dl>
                <div className="hodie-actions">
                  <Link className="btn btn--primary" to="/profile">
                    Back to your tabula
                  </Link>
                  <Link className="btn btn--ghost" to="/library">
                    Open the library
                  </Link>
                </div>
              </section>
            ) : (
              action && (
                <section className="hodie-next card">
                  <div>
                    <p className="eyebrow">{action.hint}</p>
                    <h2>{action.label.replace(' →', '')}</h2>
                  </div>
                  <Link className="btn btn--primary" to={action.to}>
                    {action.label}
                  </Link>
                </section>
              )
            )}

            <ol className="hodie-steps">
              {steps.map((step, index) => (
                <li
                  className={`hodie-step card${step.done ? ' is-done' : ''}${
                    activeKey === step.key ? ' is-active' : ''
                  }`}
                  key={step.key}
                >
                  <span className="hodie-step__num" aria-hidden="true">
                    {step.done ? '✓' : step.available === false ? '–' : index + 1}
                  </span>
                  <span className="hodie-step__body">
                    <span className="hodie-step__title">{step.title}</span>
                    <span className="hodie-step__detail">{step.detail}</span>
                    {step.key === 'reading' &&
                      activeKey === 'reading' &&
                      reading &&
                      !readingDone && (
                        <span className="hodie-step__actions">
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={markReadingDone}
                          >
                            Mark reading done
                          </button>
                        </span>
                      )}
                  </span>
                  <span className="hodie-step__status">
                    {step.done
                      ? 'Done'
                      : step.available === false
                        ? 'Skipped'
                        : activeKey === step.key
                          ? 'Next'
                          : 'Waiting'}
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </section>
  )
}
