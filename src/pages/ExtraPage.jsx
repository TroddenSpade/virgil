import { Link, Navigate, useParams } from 'react-router-dom'
import { useBookData } from '../hooks/useBookData.js'
import { useScrollSpy } from '../hooks/useScrollSpy.js'
import Loading from '../components/Loading.jsx'
import CommentarySection, { Inline } from '../components/Commentary.jsx'
import MacraNote from '../components/MacraNote.jsx'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

function SectionHead({ num, latin, english }) {
  return (
    <div className="lesson__section-head">
      <span className="lesson__section-index" aria-hidden="true">
        {num}
      </span>
      <div className="lesson__section-heading">
        <h2 className="lesson__section-title latin"><Inline text={latin} /></h2>
        <p className="lesson__section-kicker">{english}</p>
      </div>
    </div>
  )
}

export default function ExtraPage() {
  const { bookSlug, extraSlug } = useParams()
  const { book, status } = useBookData(bookSlug)

  if (status === 'loading') return <Loading title="Opening the reference" />
  if (!book) return <Navigate to={`/library/${bookSlug || ''}`} replace />

  const extras = book.extras || []
  const index = extras.findIndex((extra) => extra.slug === extraSlug)
  const extra = extras[index]

  if (!extra) return <Navigate to={`/library/${bookSlug}`} replace />

  return <Reader book={book} extra={extra} index={index} extras={extras} />
}

function Reader({ book, extra, index, extras }) {
  const sections = extra.sections.map((section, i) => ({
    ...section,
    num: ROMAN[i] || String(i + 1),
  }))
  const active = useScrollSpy(sections.map((section) => section.id))
  const prev = index > 0 ? extras[index - 1] : null
  const next = index < extras.length - 1 ? extras[index + 1] : null

  return (
    <article className={`lesson${book.kind === 'reader' || book.kind === 'workbook' ? ' lesson--latin' : ''}`}>
      <div className="container lesson__container">
        <Link to={`/library/${book.slug}`} className="back-link">
          ← {book.shortTitle}
        </Link>

        <header className="lesson__header rise">
          <div className="lesson__heading">
            <span className="lesson__numeral" aria-hidden="true">
              {ROMAN[index] || '·'}
            </span>
            <div className="lesson__heading-text">
              <p className="eyebrow">Front matter &amp; reference</p>
              <h1 className="lesson__latin-title latin">{extra.latinTitle}</h1>
              <p className="lesson__title">{extra.title}</p>
            </div>
          </div>
        </header>

        <div className="lesson__layout">
          <aside className="lesson__rail">
            <div className="lesson__rail-inner">
              <p className="lesson__rail-title">In this section</p>
              <nav className="lesson__toc" aria-label="On this page">
                {sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`} className={active === section.id ? 'is-active' : ''}>
                    <span className="lesson__toc-num">{section.num}</span>
                    <span className="lesson__toc-label">
                      <span className="lesson__toc-latin latin"><Inline text={section.latin} /></span>
                      <span className="lesson__toc-sub">{section.english}</span>
                    </span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <div className="lesson__main">
            {extra.slug === 'de-textu' && <MacraNote book={book} />}
            {sections.map((section) => (
              <section className="lesson__section" id={section.id} key={section.id}>
                <SectionHead num={section.num} latin={section.latin} english={section.english} />
                <CommentarySection blocks={section.blocks} />
              </section>
            ))}
          </div>
        </div>

        <nav className="lesson__nav" aria-label="Section navigation">
          {prev ? (
            <Link className="lesson__nav-link lesson__nav-link--prev" to={`/library/${book.slug}/extra/${prev.slug}`}>
              <span className="muted">← Previous</span>
              <span>{prev.title}</span>
            </Link>
          ) : (
            <Link className="lesson__nav-link lesson__nav-link--prev" to={`/library/${book.slug}`}>
              <span className="muted">← Back to</span>
              <span>{book.shortTitle}</span>
            </Link>
          )}
          {next ? (
            <Link className="lesson__nav-link lesson__nav-link--next" to={`/library/${book.slug}/extra/${next.slug}`}>
              <span className="muted">Next →</span>
              <span>{next.title}</span>
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
