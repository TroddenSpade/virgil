import { useMemo, useState } from 'react'
import { Inline } from './Commentary.jsx'
import { LexiconControls, LexiconText, useLexiconMode } from './Lexicon.jsx'
import DiacriticsControl from './DiacriticsControl.jsx'
import { useWordlist } from '../hooks/useWordlist.js'
import { useSavedWords } from '../hooks/useSavedWords.js'
import { applyDiacriticsToReadings, readingHasDiacritics } from '../lib/diacritics.js'

function ReadingText({ text, lexicon, wordKeys, savedWords, source }) {
  if (!lexicon.enabled || !lexicon.index) return <Inline text={text} />
  return (
    <LexiconText
      text={text}
      index={lexicon.index}
      wordKeys={wordKeys}
      savedWords={savedWords}
      source={source}
    />
  )
}

export default function Reading({ readings, source, diacritics = null }) {
  const [showNotes, setShowNotes] = useState(true)
  const lexicon = useLexiconMode()
  const wordlist = useWordlist({ active: lexicon.enabled })
  const savedWords = useSavedWords()
  const wordKeys = useMemo(
    () => new Set(wordlist.words.map((word) => word.key)),
    [wordlist.words],
  )

  const displayReadings = useMemo(
    () =>
      diacritics
        ? applyDiacriticsToReadings(readings, diacritics.options)
        : readings,
    [readings, diacritics?.options],
  )
  const hasMarks = useMemo(
    () => (readings || []).some(readingHasDiacritics),
    [readings],
  )

  if (!displayReadings?.length) return null

  const hasNotes = displayReadings.some((r) => r.notes?.length)

  return (
    <div className="readings">
      <div className="readings__bar">
        {hasNotes && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowNotes((v) => !v)}>
            {showNotes ? 'Hide marginal notes' : 'Show marginal notes'}
          </button>
        )}
        <DiacriticsControl mode={diacritics} hasMarks={hasMarks} />
        <LexiconControls mode={lexicon} />
      </div>

      {displayReadings.map((reading, index) => (
        <section key={reading.id || index} className="reading rise" id={reading.id}>
          {!reading.hideHead && (reading.latinTitle || reading.title) && (
            <header className="reading__head">
              <h3 className="reading__title latin">{reading.latinTitle || reading.title}</h3>
              {reading.latinTitle && reading.title && <p className="reading__subtitle">{reading.title}</p>}
            </header>
          )}

          <div className={`reading__grid ${showNotes && reading.notes?.length ? 'has-notes' : ''}`}>
            <div className="reading__text latin">
              {reading.personae && (
                <div className="reading__personae">
                  <ReadingText
                    text={reading.personae}
                    lexicon={lexicon}
                    wordKeys={wordKeys}
                    savedWords={savedWords}
                    source={source}
                  />
                </div>
              )}
              {reading.paragraphs.map((p, i) => (
                <p key={i}>
                  <ReadingText
                    text={p}
                    lexicon={lexicon}
                    wordKeys={wordKeys}
                    savedWords={savedWords}
                    source={source}
                  />
                </p>
              ))}
            </div>

            {showNotes && reading.notes?.length > 0 && (
              <aside className="reading__notes" aria-label="Notes">
                <p className="reading__notes-title">Marginalia</p>
                <ul>
                  {reading.notes.map((note, i) => (
                    <li key={i}>
                      <span className="reading__note-term latin">
                        <Inline text={note.term} />
                      </span>
                      <span className="reading__note-gloss latin">
                        <Inline text={note.gloss} />
                      </span>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
