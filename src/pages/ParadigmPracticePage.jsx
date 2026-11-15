import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Loading from '../components/Loading.jsx'
import { useParadigm } from '../hooks/useParadigm.js'
import { paradigmHref, wordHref } from '../lib/dictionary.js'
import { principalParts } from '../lib/grammar.js'
import {
  answerMatches,
  buildPracticeQuestions,
  practiceStats,
  readPractice,
  recordPracticeResult,
  weakSlots,
} from '../lib/paradigm-practice.js'

const SESSION_LENGTH = 10

export default function ParadigmPracticePage() {
  const { word } = useParams()
  const { lemma, entries, error, loading } = useParadigm(word)
  const [practice, setPractice] = useState(() => readPractice())
  const [phase, setPhase] = useState('intro')
  const [questions, setQuestions] = useState([])
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [selected, setSelected] = useState(null)
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const inputRef = useRef(null)

  const stats = useMemo(
    () => practiceStats(practice, lemma?.id),
    [practice, lemma],
  )
  const weak = useMemo(
    () => weakSlots(stats, entries),
    [stats, entries],
  )
  const current = questions[index] || null
  const principal = lemma ? principalParts(lemma.latin) : []
  const progress = questions.length
    ? Math.round((index / questions.length) * 100)
    : 0

  useEffect(() => {
    if (phase === 'session' && !checked && current?.type === 'form') {
      inputRef.current?.focus()
    }
  }, [phase, index, checked, current])

  if (loading) return <Loading title="Loading the paradigm" />

  if (error) {
    return (
      <section className="section paradigm-page">
        <div className="container-narrow">
          <Link to={wordHref(word)} className="back-link">← Back to the entry</Link>
          <h1>Practice</h1>
          <p className="notice">Could not load the paradigm. {error.message}</p>
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
            This word is not in the lexicon, so there is no paradigm to practise.
          </p>
        </div>
      </section>
    )
  }

  const start = () => {
    const nextQuestions = buildPracticeQuestions(entries, stats, SESSION_LENGTH)
    setQuestions(nextQuestions)
    setIndex(0)
    setAnswer('')
    setSelected(null)
    setChecked(false)
    setCorrect(false)
    setScore({ correct: 0, total: 0 })
    setPhase(nextQuestions.length ? 'session' : 'done')
  }

  const finish = (ok) => {
    if (!current) return
    setChecked(true)
    setCorrect(ok)
    setScore((previous) => ({
      correct: previous.correct + (ok ? 1 : 0),
      total: previous.total + 1,
    }))
    setPractice((previous) =>
      recordPracticeResult(previous, lemma.id, current.entry.slot, ok),
    )
  }

  const submitForm = (event) => {
    event.preventDefault()
    if (!current || checked) return
    finish(answerMatches(answer, current.answer))
  }

  const choose = (choice) => {
    if (!current || checked) return
    setSelected(choice.slot)
    finish(choice.slot === current.answerSlot)
  }

  const advance = () => {
    if (index + 1 >= questions.length) {
      setPhase('done')
      return
    }
    setIndex((value) => value + 1)
    setAnswer('')
    setSelected(null)
    setChecked(false)
    setCorrect(false)
  }

  if (phase === 'session' && current) {
    return (
      <section className="section paradigm-page">
        <div className="container-narrow">
          <nav className="dict-crumb">
            <Link to={paradigmHref(lemma.headword)}>← Paradigm</Link>
            <span aria-hidden="true">·</span>
            <span>Practice</span>
          </nav>

          <header className="practice-session-head">
            <div>
              <p className="eyebrow">Exercitatio</p>
              <p className="practice-session-count">
                Question {index + 1} of {questions.length}
              </p>
            </div>
            <button type="button" className="back-link" onClick={() => setPhase('done')}>
              End session
            </button>
          </header>

          <div
            className="progress practice-progress"
            role="progressbar"
            aria-label="Practice progress"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="progress__fill" style={{ width: `${progress}%` }} />
          </div>

          <article className="practice-card card">
            <p className="eyebrow">{current.type === 'form' ? 'Give the form' : 'Name the parse'}</p>

            {current.type === 'form' ? (
              <>
                <p className="practice-prompt">
                  Give the <strong>{current.entry.label}</strong> of{' '}
                  <span className="latin">{lemma.headword}</span>.
                </p>
                <form className="practice-form" onSubmit={submitForm}>
                  <label className="visually-hidden" htmlFor="practice-answer">
                    Your answer
                  </label>
                  <input
                    id="practice-answer"
                    ref={inputRef}
                    type="text"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    disabled={checked}
                    autoComplete="off"
                    spellCheck="false"
                    className="practice-input latin"
                    placeholder="Type the Latin form…"
                  />
                  {!checked && (
                    <button type="submit" className="btn btn--primary">
                      Check answer
                    </button>
                  )}
                </form>
              </>
            ) : (
              <>
                <p className="practice-prompt">What form is this?</p>
                <p className="practice-form-display latin">{current.entry.form}</p>
                <div className="practice-choices" role="group" aria-label="Choose the parse">
                  {current.choices.map((choice) => (
                    <button
                      type="button"
                      key={choice.slot}
                      className={`practice-choice${
                        checked && choice.slot === current.answerSlot ? ' is-correct' : ''
                      }${checked && selected === choice.slot && choice.slot !== current.answerSlot ? ' is-wrong' : ''}`}
                      onClick={() => choose(choice)}
                      disabled={checked}
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {checked && (
              <div className={`practice-feedback${correct ? ' is-correct' : ' is-wrong'}`} role="status">
                <p className="practice-feedback__title">
                  {correct ? 'Correct.' : 'Not quite.'}
                </p>
                <p className="practice-feedback__answer">
                  {current.type === 'form'
                    ? <>The form is <span className="latin">{current.answer}</span>.</>
                    : <>This is the <strong>{current.answerLabel}</strong>.</>}
                </p>
                <button type="button" className="btn btn--primary btn--sm" onClick={advance}>
                  {index + 1 >= questions.length ? 'Finish session →' : 'Next question →'}
                </button>
              </div>
            )}
          </article>
        </div>
      </section>
    )
  }

  if (phase === 'done') {
    const finalStats = practiceStats(practice, lemma.id)
    const finalWeak = weakSlots(finalStats, entries)
    const hadQuestions = questions.length > 0

    return (
      <section className="section paradigm-page">
        <div className="container-narrow">
          <nav className="dict-crumb">
            <Link to={paradigmHref(lemma.headword)}>← Paradigm</Link>
            <span aria-hidden="true">·</span>
            <span>Practice</span>
          </nav>

          <div className="practice-done card">
            <p className="eyebrow">Finis</p>
            <h1>
              {score.total
                ? 'Practice complete'
                : hadQuestions
                  ? 'Session ended'
                  : 'Nothing to practise'}
            </h1>
            {score.total ? (
              <p className="lead">
                You answered {score.correct} of {score.total}{' '}
                {score.total === 1 ? 'question' : 'questions'} correctly.
              </p>
            ) : hadQuestions ? (
              <p className="lead">No questions answered this time.</p>
            ) : (
              <p className="lead">There are no forms available for this word yet.</p>
            )}

            {finalWeak.length > 0 && (
              <div className="practice-weak">
                <p className="eyebrow">Weak spots</p>
                <ul>
                  {finalWeak.map((entry) => (
                    <li key={entry.slot}>
                      <span className="latin">{entry.form}</span>
                      <span>{entry.label}</span>
                      <small>
                        {entry.record.wrong} missed of {entry.record.seen}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="practice-done__actions">
              {entries.length > 0 && (
                <button type="button" className="btn btn--primary" onClick={start}>
                  Practise again
                </button>
              )}
              <Link className="btn btn--ghost" to={paradigmHref(lemma.headword)}>
                Back to the paradigm
              </Link>
            </div>
          </div>
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
          <Link to={paradigmHref(lemma.headword)}>Paradigm</Link>
        </nav>

        <header className="practice-hero">
          <p className="eyebrow">Exercitatio</p>
          <h1 className="lexicon__latin latin">{lemma.headword}</h1>
          {principal.length > 1 && (
            <p className="practice-hero__principal latin">{principal.join(', ')}</p>
          )}
          <p className="lead">
            Give the form for a grammatical slot or name the parse of a form. The session
            favours the cases and tenses you miss most.
          </p>
        </header>

        {weak.length > 0 && (
          <div className="practice-weak">
            <p className="eyebrow">Weak spots</p>
            <ul>
              {weak.map((entry) => (
                <li key={entry.slot}>
                  <span className="latin">{entry.form}</span>
                  <span>{entry.label}</span>
                  <small>
                    {entry.record.wrong} missed of {entry.record.seen}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="practice-start">
          {entries.length > 0 ? (
            <button type="button" className="btn btn--primary" onClick={start}>
              Begin practice · {Math.min(SESSION_LENGTH, entries.length)} questions →
            </button>
          ) : (
            <p className="notice">No forms are available for this word yet.</p>
          )}
          <Link className="back-link" to={paradigmHref(lemma.headword)}>
            Back to the paradigm
          </Link>
        </div>
      </div>
    </section>
  )
}
