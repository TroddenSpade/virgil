import { useEffect, useRef } from 'react'
import { DIACRITIC_TYPES } from '../lib/diacritics.js'

/**
 * A compact disclosure in the reading toolbar. The summary behaves as the
 * button; the panel holds one checkbox per diacritic class plus bulk actions.
 */
export default function DiacriticsControl({ mode, hasMarks = true }) {
  const detailsRef = useRef(null)
  const summaryRef = useRef(null)

  useEffect(() => {
    const details = detailsRef.current
    if (!details) return undefined

    const close = () => {
      details.open = false
    }
    const onPointerDown = (event) => {
      if (details.open && !details.contains(event.target)) close()
    }
    const onKeyDown = (event) => {
      if (event.key !== 'Escape' || !details.open) return
      event.preventDefault()
      close()
      summaryRef.current?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  if (!mode) return null
  const { options, toggle, showAll, hideAll, enabledCount } = mode

  return (
    <details className="diacritics" ref={detailsRef}>
      <summary
        ref={summaryRef}
        className="btn btn--ghost btn--sm diacritics__trigger"
        title="Choose which diacritics appear in the text"
      >
        <span>Diacritics</span>
        <span className="diacritics__count" aria-label={`${enabledCount} of ${DIACRITIC_TYPES.length} shown`}>
          {enabledCount}/{DIACRITIC_TYPES.length}
        </span>
      </summary>

      <div className="diacritics__menu">
        <p className="diacritics__title">Show in the text</p>

        {DIACRITIC_TYPES.map((type) => (
          <label className="diacritics__option" key={type.id}>
            <input
              type="checkbox"
              checked={Boolean(options[type.id])}
              onChange={() => toggle(type.id)}
            />
            <span className="diacritics__example latin" aria-hidden="true">
              {type.example}
            </span>
            <span>{type.label}</span>
          </label>
        ))}

        <div className="diacritics__actions">
          <button type="button" className="diacritics__action" onClick={showAll}>
            Show All
          </button>
          <button type="button" className="diacritics__action" onClick={hideAll}>
            Hide All
          </button>
        </div>

        {!hasMarks && (
          <p className="diacritics__note">
            This edition is printed without diacritics.
          </p>
        )}
      </div>
    </details>
  )
}
