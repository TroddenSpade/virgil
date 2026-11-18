import { Link } from 'react-router-dom'
import { correctionsForBook } from '../lib/macra.js'
import ReportMacraLink from './ReportMacraLink.jsx'

/**
 * A compact shelf/link badge for books whose quantities are editorial.
 *
 * The full explanation lives in the Note on the Text, so the badge is both a
 * confidence signal and the way there.
 */
export function MacraBadge({ book, className = '' }) {
  if (!book?.macraEdition) return null
  const label = book.macraEdition === 'mixed' ? 'Macra: printed + editorial' : 'Macra: editorial'

  return (
    <Link
      className={`tag tag--gold macra-badge${className ? ` ${className}` : ''}`}
      to={`/library/${book.slug}/extra/de-textu`}
      title="Open the note on the text and its macra"
    >
      {label}
    </Link>
  )
}

/**
 * The confidence note shown in the Note on the Text.
 *
 * It is deliberately explicit: machine-generated quantities are provisional,
 * only the listed corrections have been reviewed, and the reader can report a
 * suspected error without leaving the edition.
 */
export default function MacraNote({ book }) {
  if (!book?.macraEdition) return null

  const corrections = correctionsForBook(book.slug)
  const mixed = book.macraEdition === 'mixed'
  const page = `/library/${book.slug}/extra/de-textu`

  return (
    <aside className="macra-note" aria-label="Note on the macra">
      <p className="macra-note__kicker">Confidence note</p>
      <h2 className="macra-note__title latin">DĒ MĀCRĪS</h2>

      <p>
        <strong>{mixed ? 'Partly printed, partly machine-marked.' : 'Machine-marked, editorial.'}</strong>{' '}
        {mixed
          ? 'The quantities printed by the source are kept where it prints them; the remaining books were marked with the Alatius Latin Macronizer.'
          : 'The source prints no vowel quantities. The macra in this edition were generated with the Alatius Latin Macronizer and are editorial, not part of the transmitted text.'}{' '}
        Treat them as provisional reading aids rather than as a critical edition.
      </p>

      <p className="macra-note__count">
        {corrections.length
          ? `${corrections.length} reviewed correction${corrections.length === 1 ? '' : 's'} applied to this book.`
          : 'No corrections have been reviewed for this book yet.'}
      </p>

      {corrections.length > 0 && (
        <ul className="macra-note__corrections">
          {corrections.map((correction, index) => (
            <li key={`${correction.from}-${index}`}>
              <span className="latin">{correction.from}</span>
              <span aria-hidden="true"> → </span>
              <span className="latin">{correction.to}</span>
              {correction.reason && <span className="macra-note__reason"> — {correction.reason}</span>}
            </li>
          ))}
        </ul>
      )}

      <p className="macra-note__action">
        <ReportMacraLink
          book={book.title}
          page={page}
          label="Report a macron or suggest a correction"
        />
      </p>
    </aside>
  )
}
