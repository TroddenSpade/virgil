import { useCallback, useEffect, useState } from 'react'
import { virgilLines } from '../data/virgil-lines.js'

const AUTO_ADVANCE_MS = 8000

export default function VirgilLines() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [documentHidden, setDocumentHidden] = useState(false)
  const count = virgilLines.length
  const line = virgilLines[index]

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const sync = () => setDocumentHidden(document.hidden)
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  const auto = !paused && !hovered && !focused && !reducedMotion && !documentHidden

  useEffect(() => {
    if (!auto || count < 2) return undefined
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % count)
    }, AUTO_ADVANCE_MS)
    return () => window.clearTimeout(timer)
  }, [auto, count, index])

  const go = useCallback(
    (delta) => setIndex((current) => (current + delta + count) % count),
    [count],
  )

  const togglePaused = () => {
    if (paused) {
      setPaused(false)
      setFocused(false)
    } else {
      setPaused(true)
    }
  }

  const onKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      go(-1)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      go(1)
    }
  }

  return (
    <div
      className="motto-slider"
      role="region"
      aria-roledescription="carousel"
      aria-label="Famous lines from Virgil"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
    >
      <button
        type="button"
        className="motto-slider__arrow motto-slider__arrow--prev"
        aria-label="Previous line"
        onClick={() => go(-1)}
      >
        ←
      </button>

      <div className="motto-slider__stage" aria-live={auto ? 'off' : 'polite'} aria-atomic="true">
        <blockquote className="motto" key={index}>
          <p className="motto__latin latin">{line.latin}</p>
          <p className="motto__translation">{line.english}</p>
          <footer className="motto__source">{line.source}</footer>
        </blockquote>
      </div>

      <button
        type="button"
        className="motto-slider__arrow motto-slider__arrow--next"
        aria-label="Next line"
        onClick={() => go(1)}
      >
        →
      </button>

      <div className="motto-slider__meta">
        <span className="motto-slider__count">
          {index + 1} <span aria-hidden="true">/</span> {count}
        </span>
        {!reducedMotion && (
          <button
            type="button"
            className="motto-slider__toggle"
            aria-pressed={paused}
            aria-label={paused ? 'Play automatic rotation' : 'Pause automatic rotation'}
            onClick={togglePaused}
          >
            {paused ? 'Play' : 'Pause'}
          </button>
        )}
        <div className="motto-slider__dots" role="tablist" aria-label="Choose a line">
          {virgilLines.map((item, i) => (
            <button
              key={item.source}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Line ${i + 1}: ${item.source}`}
              className={i === index ? 'is-active' : ''}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
