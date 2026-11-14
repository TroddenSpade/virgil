import { useCallback, useState } from 'react'
import { virgilLines } from '../data/virgil-lines.js'

export default function VirgilLines() {
  const [index, setIndex] = useState(0)
  const count = virgilLines.length
  const line = virgilLines[index]

  const go = useCallback(
    (delta) => setIndex((current) => (current + delta + count) % count),
    [count],
  )

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
    >
      <button
        type="button"
        className="motto-slider__arrow motto-slider__arrow--prev"
        aria-label="Previous line"
        onClick={() => go(-1)}
      >
        ←
      </button>

      <div className="motto-slider__stage" aria-live="polite" aria-atomic="true">
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
