import { macraReportHref } from '../lib/macra.js'

/**
 * A prefilled GitHub issue for a suspected vowel quantity.
 *
 * Used on word pages, in the reading toolbar of original editions, and in the
 * note on the text. The link opens in a new tab so a reader never loses the
 * passage they were checking.
 */
export default function ReportMacraLink({
  book = '',
  chapter = '',
  reading = '',
  word = '',
  current = '',
  suggestion = '',
  page = '',
  label = 'Report a macron',
  className = '',
}) {
  const href = macraReportHref({ book, chapter, reading, word, current, suggestion, page })

  return (
    <a
      className={`report-link${className ? ` ${className}` : ''}`}
      href={href}
      target="_blank"
      rel="noreferrer"
      title="Suggest a correction to an editorial macron"
    >
      {label}
      <span aria-hidden="true"> ↗</span>
    </a>
  )
}
