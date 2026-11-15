import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getBook, getSource } from '../data/library.js'
import { useSourceChapter } from '../hooks/useSourceChapter.js'
import { useScrollSpy } from '../hooks/useScrollSpy.js'
import { useWordlist } from '../hooks/useWordlist.js'
import { useSavedWords } from '../hooks/useSavedWords.js'
import { buildSections } from '../lib/sections.js'
import { LexiconControls, LexiconText, useLexiconMode } from '../components/Lexicon.jsx'

export default function ReferencePage() {
  const { bookSlug, chapterId } = useParams()
  const book = getBook(bookSlug)

  if (!book?.referenceChapters?.length) return <Navigate to="/library" replace />

  return <Reader book={book} chapterId={chapterId} />
}

function ReferenceLine({ text, lexicon, wordKeys, savedWords, source }) {
  if (!lexicon.enabled || !lexicon.index) return text
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

/* Render a chapter's blocks. Numbered items ("li") are gathered into ordered
   lists so exercises keep their own numbering, exactly as in the book. */
function BlockList({ blocks, lexicon, wordKeys, savedWords, source }) {
  if (!Array.isArray(blocks)) return null
  const out = []
  let list = null
  let key = 0

  const flush = () => {
    if (list && list.items.length) {
      out.push(
        <ol className="reference-text__list" start={list.start} key={`l${key++}`}>
          {list.items.map((text, i) => (
            <li className="reference-text__li" key={i}>
              <ReferenceLine
                text={text}
                lexicon={lexicon}
                wordKeys={wordKeys}
                savedWords={savedWords}
                source={source}
              />
            </li>
          ))}
        </ol>,
      )
    }
    list = null
  }

  for (const block of blocks) {
    if (block.t === 'li') {
      if (!list) list = { start: block.n ?? 1, items: [] }
      list.items.push(block.text)
      continue
    }
    flush()
    if (block.t === 'h') {
      out.push(
        <h3 className="reference-text__h" key={`h${key++}`}>
          {block.text}
        </h3>,
      )
    } else {
      out.push(
        <p className="reference-text__p" key={`p${key++}`}>
          <ReferenceLine
            text={block.text}
            lexicon={lexicon}
            wordKeys={wordKeys}
            savedWords={savedWords}
            source={source}
          />
        </p>,
      )
    }
  }
  flush()
  return <>{out}</>
}

/* The narrow side-margin column the printed book carries on each page
   (vocabulary and paradigm notes), gathered once per chapter. */
function MarginNotes({ lines }) {
  if (!lines?.length) return null
  return (
    <aside className="reference-margin">
      <h3 className="reference-margin__title">Marginalia</h3>
      <ul className="reference-margin__list">
        {lines.map((line, i) => (
          <li className="reference-margin__item latin" key={i}>
            {line}
          </li>
        ))}
      </ul>
    </aside>
  )
}

function Reader({ book, chapterId }) {
  const source = getSource(book.sourceSlug)
  const chapters = book.referenceChapters
  const index = chapters.findIndex((c) => c.id === chapterId)
  const chapter = chapters[index]
  const { status, data, error } = useSourceChapter(book.sourceSlug, chapterId)
  const lexicon = useLexiconMode()
  const wordlist = useWordlist({ active: lexicon.enabled })
  const savedWords = useSavedWords()
  const wordKeys = useMemo(
    () => new Set(wordlist.words.map((word) => word.key)),
    [wordlist.words],
  )
  const readerSource = useMemo(
    () =>
      chapter
        ? {
            bookId: book.id,
            bookTitle: book.title,
            bookShort: book.shortTitle,
            bookSlug: book.slug,
            number: chapter.number,
            roman: chapter.roman,
            title: chapter.title,
            latinTitle: chapter.latinTitle,
            slug: chapter.slug || chapter.id,
            href: `/library/${book.slug}/read/${chapter.id}`,
          }
        : null,
    [book, chapter],
  )

  // Regroup the flat heading/paragraph blocks into the numbered sections used
  // by the written lessons (I Lectio, II Grammatica, III Vocabula, IV Pensa…).
  const sections = status === 'ready' ? buildSections(data?.blocks, book.sourceSlug, data || chapter || {}) : null
  const active = useScrollSpy((sections || []).map((s) => s.id))

  if (!chapter) return <Navigate to={`/library/${book.slug}`} replace />

  const prev = index > 0 ? chapters[index - 1] : null
  const next = index < chapters.length - 1 ? chapters[index + 1] : null
  // The Exercitia book is entirely Latin; set it in the Latin face.
  const latinText = book.sourceSlug === 'exercitia' ? ' latin' : ''
  const label = chapter.roman || chapter.number || '·'
  const eyebrow = chapter.number
    ? book.slug === 'familia-romana'
      ? `Capitulum ${chapter.roman}`
      : `Chapter ${chapter.roman}`
    : source?.title || book.title

  return (
    <article className="lesson">
      <div className="container lesson__container">
        <Link to={`/library/${book.slug}`} className="back-link">
          ← {book.shortTitle}
        </Link>

        <header className="lesson__header rise">
          <div className="lesson__heading">
            <span className="lesson__numeral" aria-hidden="true">
              {label}
            </span>
            <div className="lesson__heading-text">
              <p className="eyebrow">{eyebrow}</p>
              <h1 className="lesson__latin-title latin">{chapter.latinTitle || chapter.title}</h1>
              {chapter.latinTitle && chapter.title && <p className="lesson__title">{chapter.title}</p>}
            </div>
          </div>
        </header>

        {status === 'loading' && <p className="reader__status muted">Loading the chapter…</p>}
        {status === 'error' && (
          <p className="reader__status notice">Could not load this chapter. {error?.message || ''}</p>
        )}

        {status === 'ready' && (
          <div className="reader__toolbar">
            <LexiconControls mode={lexicon} />
          </div>
        )}

        {status === 'ready' && sections && (
          <div className="lesson__layout">
            <aside className="lesson__rail">
              <div className="lesson__rail-inner">
                <p className="lesson__rail-title">In this chapter</p>
                <nav className="lesson__toc" aria-label="On this page">
                  {sections.map((section) => (
                    <a key={section.id} href={`#${section.id}`} className={active === section.id ? 'is-active' : ''}>
                      <span className="lesson__toc-num">{section.num}</span>
                      <span className="lesson__toc-label">
                        <span className="lesson__toc-latin latin">{section.latin}</span>
                        <span className="lesson__toc-sub">{section.english}</span>
                      </span>
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="lesson__main">
              {sections.map((section) => (
                <section className="lesson__section" id={section.id} key={section.id}>
                  <div className="lesson__section-head">
                    <span className="lesson__section-index" aria-hidden="true">
                      {section.num}
                    </span>
                    <div className="lesson__section-heading">
                      <h2 className="lesson__section-title latin">{section.latin}</h2>
                      <p className="lesson__section-kicker">{section.english}</p>
                    </div>
                  </div>

                  <div className={`reference-text${latinText}`}>
                    <BlockList
                      blocks={section.blocks}
                      lexicon={lexicon}
                      wordKeys={wordKeys}
                      savedWords={savedWords}
                      source={readerSource}
                    />
                  </div>
                </section>
              ))}
              <MarginNotes lines={data?.margin} />
            </div>
          </div>
        )}

        {status === 'ready' && !sections && (
          <div className={`reader__body reference-text${latinText}`} style={{ marginTop: '2.5rem' }}>
            <BlockList
              blocks={data?.blocks}
              lexicon={lexicon}
              wordKeys={wordKeys}
              savedWords={savedWords}
              source={readerSource}
            />
            <MarginNotes lines={data?.margin} />
          </div>
        )}

        <nav className="lesson__nav" aria-label="Chapter navigation">
          {prev ? (
            <Link className="lesson__nav-link lesson__nav-link--prev" to={`/library/${book.slug}/read/${prev.id}`}>
              <span className="muted">← {prev.roman || prev.number || 'Back'}</span>
              <span className="latin">{prev.latinTitle || prev.title}</span>
              {prev.latinTitle && <span className="lesson__nav-gloss">{prev.title}</span>}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link className="lesson__nav-link lesson__nav-link--next" to={`/library/${book.slug}/read/${next.id}`}>
              <span className="muted">{next.roman || next.number || 'Next'} →</span>
              <span className="latin">{next.latinTitle || next.title}</span>
              {next.latinTitle && <span className="lesson__nav-gloss">{next.title}</span>}
            </Link>
          ) : (
            <Link className="lesson__nav-link lesson__nav-link--next" to={`/library/${book.slug}`}>
              <span className="muted">Back to →</span>
              <span>{book.shortTitle}</span>
            </Link>
          )}
        </nav>
      </div>
    </article>
  )
}
