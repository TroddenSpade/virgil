import { Link, useParams, Navigate } from 'react-router-dom'
import { books, getBook } from '../data/library.js'
import { keywordsFor } from '../data/keywords.js'
import { displayTitle } from '../lib/authors.js'
import { useProgress } from '../hooks/useLocalStorage.js'
import KeywordChips from '../components/KeywordChips.jsx'
import OfflineBadge from '../components/OfflineBadge.jsx'
import { MacraBadge } from '../components/MacraNote.jsx'

const EXTRA_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']

export default function BookPage() {
  const { bookSlug } = useParams()
  const book = getBook(bookSlug)

  if (!book) return <Navigate to="/library" replace />
  if (book.status !== 'active') return <Navigate to="/library" replace />
  if (book.kind === 'reference') return <ReferenceBook book={book} />

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return <ActiveBook book={book} />
}

/* A book whose full text is reproduced as a browsable reference. */
function ReferenceBook({ book }) {
  return (
    <section className="section">
      <div className="container">
        <Link to="/library" className="back-link">
          ← Library
        </Link>

        <header className="book-hero rise">
          {book.heroMark && (
            <span className="book-hero__mark" aria-hidden="true">
              {book.heroMark}
            </span>
          )}
          <p className="eyebrow">{book.latinTitle}</p>
          <h1 className="book-hero__title">{displayTitle(book)}</h1>
          <p className="book-hero__meta muted">
            {book.author} · {book.edition} · {book.publisher}, {book.year}
            {book.isbn ? ` · ISBN ${book.isbn}` : ''}
          </p>
          <p className="lead">{book.description}</p>

          <div className="book-hero__stats">
            <div>
              <strong>{book.chapterCount}</strong>
              <span>chapters</span>
            </div>
            <div>
              <strong>{book.referenceChapters.length}</strong>
              <span>full texts</span>
            </div>
          </div>
        </header>

        <hr className="rule" />

        <h2 className="section-heading">Contents</h2>
        <div className="chapter-grid">
          {book.referenceChapters.map((chapter) => (
            <Link
              key={chapter.id}
              to={`/library/${book.slug}/read/${chapter.id}`}
              className="chapter-card card is-ready"
            >
              <span className="chapter-card__num" aria-hidden="true">
                {chapter.roman || chapter.number}
              </span>
              <span className="chapter-card__body">
                <span className="chapter-card__latin latin">
                  {chapter.latinTitle || chapter.title}
                </span>
                {chapter.latinTitle && <span className="chapter-card__title">{chapter.title}</span>}
              </span>
              <span className="chapter-card__status">
                <span className="chapter-card__arrow" aria-hidden="true">
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

const SHELF_LABEL = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  latinistae: 'Latīnistae',
}

function shelfOf(book) {
  return book.isAuthorShelf ? 'latinistae' : book.levelGroup
}

function BookSwitcher({ current }) {
  const shelf = shelfOf(current)
  const others = books.filter(
    (book) =>
      book.status === 'active' &&
      book.kind !== 'reference' &&
      book.id !== current.id &&
      shelfOf(book) === shelf,
  )
  if (!others.length) return null

  const label = SHELF_LABEL[shelf]
  const heading = label ? `Other ${label} books` : 'Other books'

  return (
    <nav className="book-switcher" aria-label={heading}>
      <span className="book-switcher__label">{heading}</span>
      <div className="book-switcher__links">
        {others.map((book) => (
          <Link key={book.id} to={`/library/${book.slug}`} className="book-switcher__link">
            <span>{book.shortTitle}</span>
            <span className="book-switcher__count">{book.chapterCount}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

function ActiveBook({ book }) {
  const { isDone, count, percent } = useProgress(book.id, book.chapterCount)
  const first = book.chapters[0]

  return (
    <section className={`section book-page--framed${book.kind === 'commentary' ? ' book-page--commentary' : ''}`}>
      <div className="container">
        <Link to="/library" className="back-link">
          ← Library
        </Link>

        <header className="book-hero rise">
          {book.heroMark && (
            <span className="book-hero__mark" aria-hidden="true">
              {book.heroMark}
            </span>
          )}
          <p className="eyebrow">{book.latinTitle}</p>
          <h1 className="book-hero__title">{displayTitle(book)}</h1>
          <p className="book-hero__meta muted">
            {book.author} · {book.edition} · {book.publisher}, {book.year}
            {book.isbn ? ` · ISBN ${book.isbn}` : ''}
          </p>
          <p className="lead">{book.description}</p>

          <div className="book-hero__stats">
            <div>
              <strong>{book.chapterCount}</strong>
              <span>{book.unitPlural || (book.kind === 'reader' ? 'colloquia' : book.kind === 'workbook' ? 'capitula' : 'chapters')}</span>
            </div>
            <div>
              <strong>{book.readingCount || book.readyCount}</strong>
              <span>
                {book.kind === 'commentary'
                  ? 'chapters written'
                  : book.kind === 'reader'
                    ? `${book.readingUnitPlural || 'colloquia'} written`
                    : book.kind === 'workbook'
                      ? `${book.readingUnitPlural || 'exercises'}`
                      : 'full lessons'}
              </span>
            </div>
            <div>
              <strong>{count}</strong>
              <span>learned by you</span>
            </div>
          </div>

          <div className="book-hero__progress">
            <div className="progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
              <div className="progress__fill" style={{ width: `${percent}%` }} />
            </div>
            <span className="muted" style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem' }}>
              {percent}% complete
            </span>
          </div>

          <div className="book-hero__actions">
            <Link className="btn btn--primary" to={`/library/${book.slug}/${first.slug}`}>
              {book.kind === 'commentary'
                ? book.startLabel || `Begin ${book.unit || 'Chapter'} ${first.roman}`
                : book.kind === 'reader' || book.kind === 'workbook'
                  ? book.startLabel || `Start ${book.unit || 'Capitulum'} ${first.roman}`
                  : book.startLabel
                    ? book.startLabel
                    : book.id === 'familia-romana' || book.id === 'roma-aeterna'
                      ? `Start Capitulum ${first.roman}`
                      : 'Start Chapter I'} →
            </Link>
            {book.kind === 'commentary' && (
              <a className="btn btn--ghost" href="#commentary">
                Browse the commentary
              </a>
            )}
            <MacraBadge book={book} />
            <OfflineBadge slug={book.slug} />
          </div>

          <BookSwitcher current={book} />
        </header>

        <hr className="rule" />

        <h2
          id={book.kind === 'reader' || book.kind === 'workbook' ? 'readings' : 'commentary'}
          className="section-heading"
        >
          {book.kind === 'commentary'
            ? 'Commentary'
            : book.kind === 'reader'
              ? book.collectionLabel || 'Colloquia'
              : book.kind === 'workbook'
                ? book.collectionLabel || 'Exercitia'
                : 'Capitula'}
        </h2>
        {(book.kind === 'commentary' || book.kind === 'reader' || book.kind === 'workbook') && (
          <p className="book-page__note muted" style={{ marginTop: '-0.75rem', marginBottom: '1.5rem' }}>
            {book.kind === 'commentary'
              ? 'Each chapter follows the book’s own sections: Rēs Grammaticae Novae, the Lēctiōnēs, Recēnsiō, Studia Rōmāna, and the chapter vocabulary.'
              : book.kind === 'reader'
                ? book.collectionNote || 'Twenty-four short Latin dialogues, one after each chapter of Familia Romana, with the book’s own marginalia.'
                : book.collectionNote || 'The printed exercises for each chapter, reproduced in Latin.'}
          </p>
        )}
        <div className="chapter-grid">
          {book.chapters.map((chapter) => {
            const ready = chapter.complete
            const done = ready && isDone(chapter.number)

            const body = (
              <>
                <span className="chapter-card__num" aria-hidden="true">
                  {chapter.roman}
                </span>
                <span className="chapter-card__body">
                  <span className="chapter-card__latin latin">{chapter.latinTitle}</span>
                  <span className="chapter-card__title">{chapter.title}</span>
                  <KeywordChips ids={keywordsFor(book.slug, chapter.slug)} variant="card" />
                </span>
              </>
            )

            if (ready) {
              return (
                <Link
                  key={chapter.number}
                  to={`/library/${book.slug}/${chapter.slug}`}
                  className={`chapter-card card is-ready ${done ? 'is-done' : ''}`}
                >
                  {body}
                  <span className="chapter-card__status">
                    {done ? (
                      <span className="tag tag--laurel">learned</span>
                    ) : (
                      <span className="chapter-card__arrow" aria-hidden="true">
                        →
                      </span>
                    )}
                  </span>
                </Link>
              )
            }

            if (chapter.referenceId) {
              return (
                <Link
                  key={chapter.number}
                  to={`/library/${book.slug}/read/${chapter.referenceId}`}
                  className="chapter-card card is-ready"
                >
                  {body}
                  <span className="chapter-card__status">
                    <span className="tag tag--gold">text</span>
                  </span>
                </Link>
              )
            }

            return (
              <div key={chapter.number} className="chapter-card card is-planned">
                {body}
                <span className="chapter-card__status">
                  <span className="tag tag--gold">soon</span>
                </span>
              </div>
            )
          })}
        </div>

        {book.extras?.length > 0 && (
          <>
            <hr className="rule" />
            <h2 className="section-heading">Front matter &amp; reference</h2>
            <div className="chapter-grid">
              {book.extras.map((extra, extraIndex) => (
                <Link
                  key={extra.id}
                  to={`/library/${book.slug}/extra/${extra.slug}`}
                  className="chapter-card card is-ready"
                >
                  <span className="chapter-card__num" aria-hidden="true">
                    {EXTRA_NUMERALS[extraIndex] || '·'}
                  </span>
                  <span className="chapter-card__body">
                    <span className="chapter-card__latin latin">{extra.latinTitle}</span>
                    <span className="chapter-card__title">{extra.title}</span>
                  </span>
                  <span className="chapter-card__status">
                    <span className="chapter-card__arrow" aria-hidden="true">
                      →
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}