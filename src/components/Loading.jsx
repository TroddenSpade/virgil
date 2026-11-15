/**
 * A centred loading screen: one mark, one line, no box.
 * The ring turns while the lexicon chunk is fetched.
 */
export default function Loading({ title = 'Loading the dictionary' }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="loading__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 6.2C10.4 4.8 8.1 4 5.2 4H3v14h2.7c2.4 0 4.5.7 6.3 2.1 1.8-1.4 3.9-2.1 6.3-2.1H21V4h-2.2C15.9 4 13.6 4.8 12 6.2Z" />
          <path d="M12 6.2V20" />
        </svg>
      </span>
      <span className="loading__title">
        {title}
        <span className="loading__dots" aria-hidden="true">
          <span className="loading__dot" />
          <span className="loading__dot" />
          <span className="loading__dot" />
        </span>
      </span>
    </div>
  )
}
