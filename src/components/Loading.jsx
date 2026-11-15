/**
 * A small, on-brand loading plaque. The ring turns while the lexicon chunk is
 * fetched; the copy says what is being gathered and why it is worth waiting.
 */
export default function Loading({
  title = 'Loading the dictionary',
  hint = 'Gathering every form, lemma, and reading.',
  compact = false,
}) {
  return (
    <div className={`loading${compact ? ' loading--compact' : ''}`} role="status" aria-live="polite">
      <span className="loading__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 6.2C10.4 4.8 8.1 4 5.2 4H3v14h2.7c2.4 0 4.5.7 6.3 2.1 1.8-1.4 3.9-2.1 6.3-2.1H21V4h-2.2C15.9 4 13.6 4.8 12 6.2Z" />
          <path d="M12 6.2V20" />
        </svg>
      </span>
      <span className="loading__copy">
        <span className="loading__title">
          {title}
          <span className="loading__dots" aria-hidden="true">
            <span className="loading__dot" />
            <span className="loading__dot" />
            <span className="loading__dot" />
          </span>
        </span>
        {hint && <span className="loading__hint">{hint}</span>}
      </span>
    </div>
  )
}
