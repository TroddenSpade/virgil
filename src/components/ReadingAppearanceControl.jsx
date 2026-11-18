import { READING_MEASURES } from '../lib/reading-appearance.js'
import { useReadingAppearance } from '../hooks/useReadingAppearance.js'

/**
 * Compact text-size and column-width controls for long readings.
 *
 * The percentage doubles as the reset control, so the current size is always
 * visible without opening a menu. Preferences persist in localStorage.
 */
export default function ReadingAppearanceControl() {
  const {
    appearance,
    changeScale,
    setMeasure,
    reset,
    canDecrease,
    canIncrease,
  } = useReadingAppearance()

  const percent = Math.round(appearance.scale * 100)

  return (
    <div className="reading-appearance" role="group" aria-label="Reading appearance">
      <div className="reading-appearance__sizes">
        <button
          type="button"
          className="reading-appearance__button"
          onClick={() => changeScale(-1)}
          disabled={!canDecrease}
          aria-label="Smaller reading text"
          title="Smaller text"
        >
          A−
        </button>
        <button
          type="button"
          className="reading-appearance__button reading-appearance__value"
          onClick={reset}
          aria-label={`Text size ${percent} percent; reset to 100 percent`}
          title="Reset text size"
        >
          {percent}%
        </button>
        <button
          type="button"
          className="reading-appearance__button"
          onClick={() => changeScale(1)}
          disabled={!canIncrease}
          aria-label="Larger reading text"
          title="Larger text"
        >
          A+
        </button>
      </div>

      <label className="reading-appearance__measure">
        <span className="reading-appearance__label">Width</span>
        <select
          value={appearance.measure}
          onChange={(event) => setMeasure(event.target.value)}
          aria-label="Reading column width"
        >
          {READING_MEASURES.map((measure) => (
            <option key={measure.id} value={measure.id}>
              {measure.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
