import { absolutePageUrl, textReportHref } from '../lib/text-report.js'

/**
 * A prefilled issue for a general problem in the reading text.
 *
 * The link opens in a new tab, like the macra report link, so a reader never
 * loses the passage they were checking.
 */
export default function ReportTextLink({
  book = '',
  chapter = '',
  section = '',
  page = '',
  quote = '',
  label = 'Report an error in this text',
  className = '',
}) {
  const origin =
    typeof window === 'undefined' ? '' : window.location.origin
  const href = textReportHref({
    book,
    chapter,
    section,
    quote,
    page: absolutePageUrl(page, origin),
  })

  return (
    <a
      className={`report-link${className ? ` ${className}` : ''}`}
      href={href}
      target="_blank"
      rel="noreferrer"
      title="Report a typo, a missing word, or another problem in this text"
    >
      {label}
      <span aria-hidden="true"> ↗</span>
    </a>
  )
}
