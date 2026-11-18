import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getBook } from '../data/library.js'
import { keywordsFor } from '../data/keywords.js'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { primaryKeywordLabels } from './KeywordChips.jsx'
import { Scenery } from './IterScenes.jsx'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

const LEVEL_LABEL = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

/* Vertical rhythm of the road, in pixels. */
const NODE_GAP = 32
const WAY_GAP = 34
const TOP_PAD = 36
const BOTTOM_PAD = 76
const TICK = 30 // lead from the road to a label
const RAIL_ROWS = 11 // default lessons shown in the right-hand index
const RAIL_ROWS_MIN = 7
const RAIL_ROWS_MAX = 29

const GROUNDS = [
  ['via', 'Via'],
  ['tabula', 'Tabula'],
  ['plain', 'Plain'],
]

/* The stage boundaries: a different kind of country under each heading. */
const DIVIDERS = ['rail', 'ridge', 'river', 'road', 'aqueduct', 'forest', 'wall', 'hedge']

/* Ghosted places from the Aeneid's world, scattered down the strip map. */
const PLACES = [
  { at: 0.055, side: 'right', name: 'TROIA' },
  { at: 0.17, side: 'left', name: 'CARTHAGO' },
  { at: 0.29, side: 'right', name: 'CVMAE' },
  { at: 0.41, side: 'left', name: 'LATIVM' },
  { at: 0.53, side: 'right', name: 'ROMA' },
  { at: 0.66, side: 'left', name: 'OSTIA' },
  { at: 0.79, side: 'right', name: 'LAVRENTVM' },
  { at: 0.91, side: 'left', name: 'ALBA LONGA' },
]

const lessonKey = (lesson) => `${lesson.bookSlug}/${lesson.slug}`

const trunc = (text, max) => {
  const s = String(text || '').replace(/\s+/g, ' ').trim()
  if (!s || s.length <= max) return s
  const cut = s.slice(0, max - 1)
  const trim = cut.lastIndexOf(' ')
  return (trim > max * 0.6 ? cut.slice(0, trim) : cut).trimEnd() + '…'
}

function useWidth(ref) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const measure = () => setWidth(el.clientWidth || 0)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return width
}

/* The geometry of the road: a meander that sways with one period while its
   depth slowly breathes with another, so the line never quite repeats. */
function buildLayout(stages, width) {
  const cx = width / 2
  const narrow = width < 640
  const amp = narrow
    ? Math.max(34, Math.min(0.14 * width, 100))
    : Math.max(46, Math.min(0.2 * width, 240))
  const sideSpace = width / 2 - amp - TICK - 8
  const titleChars = Math.max(9, Math.min(46, Math.floor(sideSpace / 7)))
  const roadX = (y) => cx + amp * Math.sin(y / 64) * Math.sin(y / 480 + 0.9)

  const items = []
  let y = TOP_PAD
  let side = 1
  const nextSide = () => (side = -side)

  stages.forEach((stage, si) => {
    const gateGap = narrow ? 80 : 62
    const gateY = y + (narrow ? 44 : 31)
    y += gateGap
    items.push({
      type: 'gate',
      stage,
      si,
      y: gateY,
      x: roadX(gateY),
      side: si % 2 ? -1 : 1,
      centered: narrow,
      half: narrow ? 18 : 22,
    })

    const lessons = stage.lessons
    let i = 0
    while (i < lessons.length) {
      let j = i
      while (j + 1 < lessons.length && lessons[j + 1].bookSlug === lessons[i].bookSlug) j += 1
      const first = lessons[i]
      if (j - i + 1 >= 3) {
        const wayY = y + 15
        y += WAY_GAP
        items.push({
          type: 'way',
          y: wayY,
          x: roadX(wayY),
          label: first.bookMark || first.bookShort,
          side: nextSide(),
        })
      }
      for (let k = i; k <= j; k += 1) {
        const lessonY = y + NODE_GAP / 2
        y += NODE_GAP
        items.push({ type: 'lesson', lesson: lessons[k], y: lessonY, x: roadX(lessonY), side: nextSide() })
      }
      i = j + 1
    }
  })

  const endY = y + 26
  items.push({ type: 'way', terminal: true, y: endY, x: roadX(endY), label: 'Finis', side: nextSide() })
  const height = endY + 50

  const points = []
  for (let yy = 16; yy <= height - 16; yy += 7) points.push([roadX(yy), yy])
  const pathAt = (offset = 0) =>
    points
      .map(([px, py], idx) => `${idx === 0 ? 'M' : 'L'}${(px + offset).toFixed(1)} ${py}`)
      .join('')
  const d = pathAt()

  return {
    items,
    height,
    d,
    kerbLeft: pathAt(-8),
    kerbRight: pathAt(8),
    roadX,
    titleChars,
  }
}

/* The whole itinerary as one winding road: stage milestones, waystations for
   each work, and a stop for every lesson. Clicking a stop opens the chapter;
   clicking its dot marks it learned. The road is flanked by two indexes —
   the stages on the left, the lessons on the right — which follow the scroll
   and bold the point the reader is actually looking at. */
export default function IterMap({ stages, isDone, nextLesson, onToggle }) {
  const centerRef = useRef(null)
  const svgRef = useRef(null)
  const width = useWidth(centerRef)
  const navigate = useNavigate()
  const location = useLocation()
  // The hover card: which stop, and which side of it to open on.
  const [tip, setTip] = useState(null)
  // The ground behind the road: an antique strip map, a built via, or plain paper.
  const [ground, setGround] = useLocalStorage('virgil:iter-map-ground', 'via')
  const groundMode = ground === 'tabula' || ground === 'plain' ? ground : 'via'
  // Which milestone and which lesson sit under the reading line.
  const [active, setActive] = useState({ gate: null, lesson: null })
  const layout = useMemo(
    () => (width > 260 ? buildLayout(stages, width) : null),
    [stages, width],
  )
  const flatLessons = useMemo(
    () => (layout ? layout.items.filter((item) => item.type === 'lesson') : []),
    [layout],
  )

  // Each lesson's place on the whole road: its number and the stage it sits in.
  const lessonMeta = useMemo(() => {
    const map = new Map()
    let index = 0
    for (const stage of stages) {
      for (const lesson of stage.lessons) {
        index += 1
        map.set(lessonKey(lesson), { index, stage })
      }
    }
    return map
  }, [stages])

  // How many lessons the right index can show, so it fills the viewport.
  const [railRows, setRailRows] = useState(RAIL_ROWS)
  useEffect(() => {
    const compute = () => {
      const rows = Math.floor((window.innerHeight - 150) / 26)
      setRailRows(Math.max(RAIL_ROWS_MIN, Math.min(RAIL_ROWS_MAX, rows)))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  // A stage hash (#casus …) scrolls to that stage's milestone on the road.
  useEffect(() => {
    if (!layout) return
    const id = location.hash.replace('#', '')
    if (!id) return
    const gate = layout.items.find((item) => item.type === 'gate' && item.stage.id === id)
    if (!gate || !svgRef.current) return
    const top = svgRef.current.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: top + gate.y - 160, behavior: 'auto' })
  }, [layout, location.hash])

  /* Follow the scroll: the reading line sits a little above the middle of the
     viewport. The last milestone above it is the stage in view; the lesson
     whose stop is nearest to it is the lesson in view. */
  useEffect(() => {
    if (!layout) return undefined
    let frame = 0
    const update = () => {
      frame = 0
      const svg = svgRef.current
      if (!svg) return
      const local = window.innerHeight * 0.42 - svg.getBoundingClientRect().top
      let gateId = null
      let lessonId = null
      let nearest = Infinity
      for (const item of layout.items) {
        if (item.type === 'gate' && item.y <= local) gateId = item.stage.id
        if (item.type === 'lesson') {
          const distance = Math.abs(item.y - local)
          if (distance < nearest) {
            nearest = distance
            lessonId = lessonKey(item.lesson)
          }
        }
      }
      if (!gateId) {
        const firstGate = layout.items.find((item) => item.type === 'gate')
        gateId = firstGate ? firstGate.stage.id : null
      }
      setActive((prev) =>
        prev.gate === gateId && prev.lesson === lessonId ? prev : { gate: gateId, lesson: lessonId },
      )
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [layout])

  const scrollToY = (y) => {
    const svg = svgRef.current
    if (!svg) return
    const top = svg.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: top + y - 160, behavior: 'smooth' })
  }

  const jumpToGate = (id) => {
    const gate = layout?.items.find((item) => item.type === 'gate' && item.stage.id === id)
    if (gate) scrollToY(gate.y)
  }

  const jumpToLesson = (key) => {
    const item = layout?.items.find((item) => item.type === 'lesson' && lessonKey(item.lesson) === key)
    if (item) scrollToY(item.y)
  }

  const nextKey = nextLesson ? lessonKey(nextLesson) : null

  /* Show the hover card for a stop, opening above it when there is room
     between the sticky header and the stop, otherwise below — whichever
     side of the road actually has space in the viewport right now. */
  const showTip = (item, lesson, meta) => () => {
    const svg = svgRef.current
    if (!svg) return
    const box = svg.getBoundingClientRect()
    const anchorTop = box.top + item.y - 8
    const anchorBottom = box.top + item.y + 8
    const roomAbove = anchorTop - 76 // sticky header + air
    const roomBelow = window.innerHeight - anchorBottom
    const est = 330 // card + stem, estimated
    const place =
      roomAbove >= est
        ? 'above'
        : roomBelow >= est
          ? 'below'
          : roomAbove >= roomBelow
            ? 'above'
            : 'below'
    setTip({ item, lesson, place, meta })
  }
  const hideTip = () => setTip(null)

  return (
    <div className="iter-map" data-ground={groundMode}>
      <div className="iter-map__topbar">
        <div className="iter-map__legend" aria-hidden="true">
          <span><i className="dot dot--done" /> learned</span>
          <span><i className="dot" /> to read</span>
          <span><i className="dot dot--next" /> you are here</span>
          <span><i className="dot dot--reading" /> reading</span>
        </div>

        <div className="iter-map__grounds" role="group" aria-label="Map background">
          <span className="iter-map__grounds-label">Ground</span>
          <span className="iter-map__grounds-set">
            {GROUNDS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={groundMode === value ? 'is-active' : ''}
                aria-pressed={groundMode === value}
                onClick={() => setGround(value)}
              >
                {label}
              </button>
            ))}
          </span>
        </div>
      </div>

      <div className="iter-map__frame">
        <StageRail
          stages={stages}
          activeGate={active.gate}
          isDone={isDone}
          onJump={jumpToGate}
        />

        <div className="iter-map__center" ref={centerRef}>
          {layout && (
            <svg
              ref={svgRef}
              className="iter-map__svg"
              width={width}
              height={layout.height}
              viewBox={`0 0 ${width} ${layout.height}`}
              role="group"
              aria-label="The whole itinerary as a winding road, from the first lesson to the last"
            >
              <MapGround mode={groundMode} width={width} layout={layout} />
              <path className="iter-map__road" d={layout.d} />
              <path className="iter-map__road-dash" d={layout.d} />

              {layout.items.map((item, index) => {
                if (item.type === 'gate') {
                  const { stage, si } = item
                  const anchor = item.side < 0 ? 'end' : 'start'
                  const learned = stage.lessons.filter(isDone).length
                  return (
                    <g
                      className="iter-map__gate"
                      key={`gate-${stage.id}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${stage.latin} — ${stage.title}, milestone ${si + 1} of ${stages.length}`}
                      onClick={() => navigate(`/iter#${stage.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          navigate(`/iter#${stage.id}`)
                        }
                      }}
                    >
                      <rect
                        className="iter-map__gate-plaque"
                        x={item.x - item.half}
                        y={item.y - item.half}
                        width={item.half * 2}
                        height={item.half * 2}
                        rx={5}
                      />
                      <text className="iter-map__gate-num" x={item.x} y={item.y + 5} textAnchor="middle">
                        {ROMAN[si] || si + 1}
                      </text>
                      {item.centered ? (
                        <>
                          <text className="iter-map__gate-latin" x={item.x} y={item.y - 36} textAnchor="middle">
                            {stage.latin}
                          </text>
                          <text className="iter-map__gate-sub" x={item.x} y={item.y - 22} textAnchor="middle">
                            {trunc(`${stage.range} · ${learned}/${stage.lessonCount}`, 34)}
                          </text>
                        </>
                      ) : (
                        <>
                          <text
                            className="iter-map__gate-latin"
                            x={item.x + item.side * 46}
                            y={item.y - 5}
                            textAnchor={anchor}
                          >
                            {stage.latin}
                          </text>
                          <text
                            className="iter-map__gate-sub"
                            x={item.x + item.side * 46}
                            y={item.y + 12}
                            textAnchor={anchor}
                          >
                            {trunc(`${stage.range} · ${learned}/${stage.lessonCount}`, 34)}
                          </text>
                        </>
                      )}
                    </g>
                  )
                }

                if (item.type === 'way') {
                  if (item.terminal) {
                    return (
                      <Finish key={`finish-${index}`} x={item.x} y={item.y} side={item.side} />
                    )
                  }

                  return (
                    <g className="iter-map__way" key={`way-${index}`} aria-hidden="true">
                      <path
                        className="iter-map__way-diamond"
                        d={`M ${item.x - 6} ${item.y} L ${item.x} ${item.y - 6} L ${item.x + 6} ${item.y} L ${item.x} ${item.y + 6} Z`}
                      />
                      <text
                        className="iter-map__way-label"
                        x={item.x + item.side * 17}
                        y={item.y + 3.5}
                        textAnchor={item.side < 0 ? 'end' : 'start'}
                      >
                        {item.label}
                      </text>
                    </g>
                  )
                }

                const { lesson } = item
                const key = lessonKey(lesson)
                const done = isDone(lesson)
                const isNext = nextKey === key
                const anchor = item.side < 0 ? 'end' : 'start'
                const labelX = item.x + item.side * TICK
                const rawLatin = lesson.latinTitle || ''
                const caput = /^cap(ut|vt|itvl|itul)/i.test(rawLatin)
                const main = caput || !rawLatin ? lesson.title || rawLatin : rawLatin
                const full = [lesson.bookMark || lesson.bookShort, lesson.roman, rawLatin, lesson.title]
                  .filter(Boolean)
                  .join(' · ')
                const stopClass = `iter-map__stop${done ? ' is-done' : ''}${isNext ? ' is-next' : ''}${
                  lesson.alternative ? ' is-alt' : ''
                }${lesson.reading ? ' is-reading' : ''}`

                return (
                  <g
                    className={stopClass}
                    key={key}
                    onMouseEnter={showTip(item, lesson, lessonMeta.get(key))}
                    onMouseLeave={hideTip}
                    onFocus={showTip(item, lesson, lessonMeta.get(key))}
                    onBlur={hideTip}
                  >
                    <g
                      role="button"
                      tabIndex={-1}
                      aria-label={done ? `Mark ${full} as not learned` : `Mark ${full} as learned`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onToggle(lesson)
                      }}
                    >
                      <rect className="iter-map__hit" x={item.x - 14} y={item.y - 14} width={28} height={28} rx={7} />
                      <rect className="iter-map__dot" x={item.x - 7.5} y={item.y - 7.5} width={15} height={15} rx={4.5} />
                      {isNext && (
                        <rect
                          className="iter-map__pulse"
                          x={item.x - 7.5}
                          y={item.y - 7.5}
                          width={15}
                          height={15}
                          rx={4.5}
                        />
                      )}
                      {done && (
                        <path
                          className="iter-map__check"
                          transform={`translate(${item.x} ${item.y})`}
                          d="M -3.4 0.2 L -1 2.6 L 3.9 -2.6"
                        />
                      )}
                    </g>
                    <line
                      className="iter-map__tick"
                      x1={item.x + item.side * 10}
                      y1={item.y}
                      x2={item.x + item.side * (TICK - 4)}
                      y2={item.y}
                    />
                    <g
                      role="link"
                      tabIndex={0}
                      aria-label={`Open ${full}`}
                      onClick={() => navigate(lesson.href)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          navigate(lesson.href)
                        }
                      }}
                    >
                      <text className="iter-map__mark" x={labelX} y={item.y - 4} textAnchor={anchor}>
                        {`${lesson.bookMark || lesson.bookShort} · ${lesson.roman}`}
                      </text>
                      <text className="iter-map__title" x={labelX} y={item.y + 11} textAnchor={anchor}>
                        {trunc(main, layout.titleChars)}
                      </text>
                    </g>
                  </g>
                )
              })}
            </svg>
          )}

          {/* Hover card for the stop under the pointer, with what the
              chapter's own page shows: work and numeral, Latin title,
              English title, level, focus, and its tags. */}
          {tip && <HoverCard tip={tip} width={width} isDone={isDone} total={flatLessons.length} />}
        </div>

        {layout && (
          <LessonRail
            items={flatLessons}
            activeLesson={active.lesson}
            isDone={isDone}
            onJump={jumpToLesson}
            rows={railRows}
          />
        )}
      </div>
    </div>
  )
}

/* The left index: every stage as a milestone in the margin, with its own
   progress rule. The stage in view is inked and its edge marked in oxblood. */
function StageRail({ stages, activeGate, isDone, onJump }) {
  return (
    <nav className="iter-map__rail iter-map__stages" aria-label="Stages of the itinerary">
      <div className="iter-map__rail-inner">
        <p className="iter-map__rail-title">
          <span>Stages</span>
          <span className="iter-map__rail-count">{ROMAN[stages.length - 1] || stages.length}</span>
        </p>
        <ol className="iter-map__rail-list">
          {stages.map((stage, index) => {
            const learned = stage.lessons.filter(isDone).length
            const percent = stage.lessonCount
              ? Math.round((learned / stage.lessonCount) * 100)
              : 0
            const current = activeGate === stage.id
            return (
              <li key={stage.id}>
                <button
                  type="button"
                  className={`iter-map__stage${current ? ' is-active' : ''}`}
                  aria-current={current ? 'true' : undefined}
                  onClick={() => onJump(stage.id)}
                >
                  <span className="iter-map__stage-num">{ROMAN[index] || index + 1}</span>
                  <span className="iter-map__stage-name latin">{stage.latin}</span>
                  <span className="iter-map__stage-meta">
                    {learned} / {stage.lessonCount}
                  </span>
                  <span className="iter-map__stage-bar" aria-hidden="true">
                    <span style={{ width: `${percent}%` }} />
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}

/* The right index: a moving window of lessons around the one in view. The
   window is as tall as the viewport allows, so the index fills the margin. */
function LessonRail({ items, activeLesson, isDone, onJump, rows }) {
  const total = items.length
  const found = items.findIndex((item) => lessonKey(item.lesson) === activeLesson)
  const current = found >= 0 ? found : 0
  const size = Math.min(rows, total)
  const start = Math.max(0, Math.min(current - Math.floor(size / 2), total - size))
  const shown = items.slice(start, start + size)

  return (
    <nav className="iter-map__rail iter-map__lessons" aria-label="Lessons at this point on the road">
      <div className="iter-map__rail-inner">
        <p className="iter-map__rail-title">
          <span>Lectiō</span>
          <span className="iter-map__rail-count">
            {total ? current + 1 : 0} / {total}
          </span>
        </p>
        <ol className="iter-map__rail-list">
          {shown.map(({ lesson }) => {
            const key = lessonKey(lesson)
            const done = isDone(lesson)
            const isCurrent = key === activeLesson
            return (
              <li key={key}>
                <button
                  type="button"
                  className={`iter-map__lesson${isCurrent ? ' is-active' : ''}${done ? ' is-done' : ''}`}
                  aria-current={isCurrent ? 'true' : undefined}
                  onClick={() => onJump(key)}
                >
                  <span className="iter-map__lesson-dot" aria-hidden="true" />
                  <span className="iter-map__lesson-num">{lesson.roman}</span>
                  <span className="iter-map__lesson-title latin">
                    {lesson.latinTitle || lesson.title}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}

/* The card itself: the whole dossier the chapter's own page carries — work,
   unit and numeral, both titles, its tagline, focus, what it contains, its
   keywords and its state — opening above or below the stop as space allows. */
function HoverCard({ tip, width, isDone, total }) {
  const { item, lesson, place, meta } = tip
  const tipW = Math.min(340, Math.max(220, width - 24))
  const left = Math.min(
    Math.max(item.x, tipW / 2 + 8),
    Math.max(tipW / 2 + 8, width - tipW / 2 - 8),
  )
  const done = isDone(lesson)
  const book = getBook(lesson.bookSlug)
  const isReader = book?.kind === 'reader' || book?.kind === 'workbook'
  const unit = book?.unit || (isReader ? 'Colloquium' : 'Capitulum')
  const sameTitle =
    lesson.latinTitle &&
    lesson.title &&
    lesson.latinTitle.trim().toLowerCase() === lesson.title.trim().toLowerCase()

  const contents = [
    lesson.grammarCount && `${lesson.grammarCount} grammar`,
    lesson.vocabularyCount && `${lesson.vocabularyCount} words`,
    lesson.pensaCount && `${lesson.pensaCount} practices`,
    lesson.readingsCount &&
      `${lesson.readingsCount} reading${lesson.readingsCount > 1 ? 's' : ''}`,
  ].filter(Boolean)
  const keywords = primaryKeywordLabels(keywordsFor(lesson.bookSlug, lesson.slug), 3)

  return (
    <div
      className={`iter-map__tip is-${place}${done ? ' is-done' : ''}`}
      style={{ left, top: item.y, width: tipW }}
      aria-hidden="true"
    >
      <p className="iter-map__tip-band">
        <span className="iter-map__tip-unit">
          {book?.shortTitle || lesson.bookShort}
          {lesson.roman && ` · ${unit} ${lesson.roman}`}
        </span>
        <span className="iter-map__tip-level" data-level={lesson.level}>
          {LEVEL_LABEL[lesson.level] || lesson.level}
        </span>
      </p>

      <p className="iter-map__tip-latin latin">{lesson.latinTitle || lesson.title}</p>
      {!sameTitle && lesson.title && <p className="iter-map__tip-title">{lesson.title}</p>}
      {lesson.tagline && <p className="iter-map__tip-tagline">{lesson.tagline}</p>}

      {(lesson.focus || contents.length > 0) && (
        <div className="iter-map__tip-facts">
          {lesson.focus && (
            <p className="iter-map__tip-focus">
              <span className="iter-map__tip-key">Focus</span>
              {lesson.focus}
            </p>
          )}
          {contents.length > 0 && (
            <p className="iter-map__tip-contents">{contents.join(' · ')}</p>
          )}
        </div>
      )}

      {keywords.length > 0 && (
        <p className="iter-map__tip-keywords">
          {keywords.map((label) => (
            <span key={label} className="iter-map__tip-keyword">
              {label}
            </span>
          ))}
        </p>
      )}

      {(done || lesson.reading || lesson.alternative) && (
        <p className="iter-map__tip-tags">
          {done && <span className="iter-map__tip-tag is-learned">Learned</span>}
          {lesson.reading && <span className="iter-map__tip-tag">Reading</span>}
          {lesson.alternative && <span className="iter-map__tip-tag is-alt">Alternative</span>}
        </p>
      )}

      <p className="iter-map__tip-foot">
        <span className="iter-map__tip-pos">
          {meta ? `Lesson ${meta.index} of ${total} · ${meta.stage.latin}` : `Lesson of ${total}`}
        </span>
        <span className="iter-map__tip-cta">Open chapter →</span>
      </p>
    </div>
  )
}

/* ---------- The ground behind the road ---------- */

function MapGround({ mode, width, layout }) {
  if (mode === 'plain' || !layout) return null
  return (
    <g className={`iter-map__ground is-${mode}`} aria-hidden="true" pointerEvents="none">
      {mode === 'tabula' ? (
        <TabulaGround width={width} layout={layout} />
      ) : (
        <ViaGround width={width} layout={layout} />
      )}
    </g>
  )
}

/* An antique strip map: a sea margin, a survey grid, contours, place names,
   a compass rose and a scale bar, all printed faintly under the road. */
function TabulaGround({ width, layout }) {
  const { height } = layout
  const seaW = Math.max(64, width * 0.14)
  const coast = coastPath(height, seaW)
  const inset = 6

  return (
    <>
      <defs>
        <pattern id="iter-grid-fine" width="64" height="64" patternUnits="userSpaceOnUse">
          <path className="iter-map__ground-line" d="M64 0H0V64" />
        </pattern>
        <pattern id="iter-grid-major" width="320" height="320" patternUnits="userSpaceOnUse">
          <path className="iter-map__ground-line is-major" d="M320 0H0V320" />
        </pattern>
        <pattern id="iter-contour" width="260" height="180" patternUnits="userSpaceOnUse">
          <path className="iter-map__ground-contour" d="M0 46 C64 20 196 72 260 46" />
          <path className="iter-map__ground-contour" d="M0 124 C64 98 196 150 260 124" />
        </pattern>
      </defs>

      <path className="iter-map__ground-coast-fill" d={`${coast} L0 ${height} L0 0 Z`} />
      <path className="iter-map__ground-coast" d={coast} />
      <ellipse className="iter-map__ground-island" cx={seaW * 0.46} cy={height * 0.23} rx="13" ry="5" />
      <ellipse className="iter-map__ground-island" cx={seaW * 0.3} cy={height * 0.49} rx="8" ry="3.5" />
      <ellipse className="iter-map__ground-island" cx={seaW * 0.55} cy={height * 0.76} rx="15" ry="6" />

      <rect
        className="iter-map__ground-grid"
        x="0"
        y="0"
        width={width}
        height={height}
        fill="url(#iter-grid-fine)"
      />
      <rect
        className="iter-map__ground-grid is-major"
        x="0"
        y="0"
        width={width}
        height={height}
        fill="url(#iter-grid-major)"
      />
      <rect
        className="iter-map__ground-contours"
        x="0"
        y="0"
        width={width}
        height={height}
        fill="url(#iter-contour)"
      />

      {PLACES.map((place) => (
        <text
          key={place.name}
          className="iter-map__ground-place"
          x={place.side === 'left' ? seaW + 20 : width - 20}
          y={height * place.at}
          textAnchor={place.side === 'left' ? 'start' : 'end'}
        >
          {place.name}
        </text>
      ))}

      <CompassRose x={width - 44} y={54} />
      <ScaleBar x={24} y={height - 26} />

      <rect
        className="iter-map__ground-frame"
        x={inset}
        y={inset}
        width={width - inset * 2}
        height={height - inset * 2}
        rx="2"
      />
    </>
  )
}

/* The via itself: a paved roadbed with kerbs, milestones at the stage
   gates, and an aqueduct in the margin. */
function ViaGround({ width, layout }) {
  const { height, d, kerbLeft, kerbRight, items } = layout
  const gates = items.filter((item) => item.type === 'gate')

  return (
    <>
      <defs>
        <pattern id="iter-paving" width="22" height="16" patternUnits="userSpaceOnUse">
          <path className="iter-map__ground-paving-line" d="M0 3 L6 1 L11 4 L5 7 Z" />
          <path className="iter-map__ground-paving-line" d="M11 4 L17 2 L22 5 L16 8 Z" />
          <path className="iter-map__ground-paving-line" d="M1 11 L7 9 L13 12 L7 15 Z" />
          <path className="iter-map__ground-paving-line" d="M13 12 L19 10 L22 13 L16 15 Z" />
        </pattern>
      </defs>

      {gates.map((gate, index) => (
        <StageDivider
          key={`divider-${gate.stage.id}`}
          kind={DIVIDERS[index % DIVIDERS.length]}
          width={width}
          y={gate.y + (gate.centered ? -29 : -1)}
          seed={index}
        />
      ))}

      <path className="iter-map__ground-shoulder" d={d} />
      <path className="iter-map__ground-bed-base" d={d} />
      <path className="iter-map__ground-bed" d={d} stroke="url(#iter-paving)" />
      <path className="iter-map__ground-kerb" d={kerbLeft} />
      <path className="iter-map__ground-kerb" d={kerbRight} />


      {gates.map((gate, index) => (
        <Milestone
          key={`milestone-${gate.stage.id}`}
          x={gate.x - gate.side * 34}
          y={gate.y + 18}
          numeral={ROMAN[index] || index + 1}
        />
      ))}

      <Scenery items={items} width={width} />
    </>
  )
}

/* One stage boundary: a rail line, a ridge, a river, a via, an aqueduct,
   a wood, a wall or a hedge. Each follows a shallow bow so it reads as
   drawn across the strip map rather than ruled with a straightedge. */
function StageDivider({ kind, width, y, seed }) {
  const lift = seed % 2 ? 1 : -1
  const bend = (x) => y + lift * 6 * Math.sin((x / width) * Math.PI)
  const polyline = (offset = 0) => {
    let d = ''
    for (let x = 0; x <= width; x += 14) {
      d += `${x ? 'L' : 'M'}${x} ${(bend(x) + offset).toFixed(1)}`
    }
    return d
  }

  if (kind === 'rail') {
    const sleepers = []
    for (let x = 6; x < width; x += 24) sleepers.push([x, bend(x)])
    return (
      <g className="iter-map__divider is-rail">
        <path d={`${polyline(-2.5)} ${polyline(2.5)}`} />
        {sleepers.map(([x, yy]) => (
          <path key={x} d={`M${x} ${(yy - 6).toFixed(1)} V${(yy + 6).toFixed(1)}`} />
        ))}
      </g>
    )
  }

  if (kind === 'ridge') {
    const ridge = (offset, amp, gap, phase) => {
      const points = []
      let i = 0
      for (let x = -gap; x <= width + gap; x += gap) {
        const h = amp * (0.45 + 0.55 * Math.abs(Math.sin(seed * 1.9 + phase + i * 1.21)))
        points.push([x, bend(x) + offset])
        points.push([x + gap / 2, bend(x + gap / 2) + offset - h])
        i += 1
      }
      points.push([width + gap, bend(width + gap) + offset])
      return points
        .map(([px, py], idx) => `${idx ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`)
        .join('')
    }
    return (
      <g className="iter-map__divider is-ridge">
        <path className="is-back" d={ridge(2, 7, 78, 0.7)} />
        <path className="is-front" d={ridge(4, 11, 54, 0.2)} />
      </g>
    )
  }

  if (kind === 'river') {
    const wave = (offset, amp, phase) => {
      let d = ''
      for (let x = 0; x <= width; x += 14) {
        d += `${x ? 'L' : 'M'}${x} ${(
          bend(x) +
          offset +
          Math.sin(x / 52 + phase) * amp
        ).toFixed(1)}`
      }
      return d
    }
    return (
      <g className="iter-map__divider is-river">
        <path d={wave(0, 3.5, 0.4)} />
        <path d={wave(5, 3, 1.25)} />
        <path className="is-bank" d={wave(-4.5, 2.4, 2.1)} />
      </g>
    )
  }

  if (kind === 'road') {
    return (
      <g className="iter-map__divider is-road">
        <path d={`${polyline(-3)} ${polyline(3)}`} />
        <path className="is-dash" d={polyline(0)} />
      </g>
    )
  }

  if (kind === 'aqueduct') {
    const bays = []
    for (let x = 0; x < width; x += 30) {
      const x2 = Math.min(x + 30, width)
      const y1 = bend(x)
      const y2 = bend(x2)
      const top = Math.min(y1, y2)
      bays.push(
        `M${x} ${y1.toFixed(1)} V${(y1 + 9).toFixed(1)} Q${(x + 15).toFixed(1)} ${(
          top - 3
        ).toFixed(1)} ${x2.toFixed(1)} ${(y2 + 9).toFixed(1)} V${y2.toFixed(1)}`,
      )
    }
    return (
      <g className="iter-map__divider is-aqueduct">
        <path d={polyline(0)} />
        {bays.map((d, index) => (
          <path key={index} d={d} />
        ))}
      </g>
    )
  }

  if (kind === 'forest') {
    const trees = []
    for (let x = 14; x < width - 8; x += 40) {
      const base = bend(x)
      const h = 7 + ((x * 7 + seed * 23) % 4)
      trees.push(
        `M${x} ${(base + 8).toFixed(1)} L${x - 5} ${(base + 3).toFixed(1)} L${x - 2} ${(
          base + 3
        ).toFixed(1)} L${x - 6} ${(base - 4).toFixed(1)} L${x} ${(base - h).toFixed(
          1,
        )} L${x + 6} ${(base - 4).toFixed(1)} L${x + 2} ${(base + 3).toFixed(1)} L${
          x + 5
        } ${(base + 3).toFixed(1)} Z`,
      )
    }
    return (
      <g className="iter-map__divider is-forest">
        <path d={polyline(8)} />
        {trees.map((d, index) => (
          <path key={index} d={d} />
        ))}
      </g>
    )
  }

  if (kind === 'wall') {
    const merlons = []
    for (let x = 0; x < width; x += 20) {
      const yy = bend(x + 4) + 1
      merlons.push(
        `M${(x + 4).toFixed(1)} ${yy.toFixed(1)} V${(yy - 5).toFixed(1)} H${(x + 12).toFixed(
          1,
        )} V${yy.toFixed(1)}`,
      )
    }
    return (
      <g className="iter-map__divider is-wall">
        <path d={`${polyline(6)} ${polyline(1)}`} />
        {merlons.map((d, index) => (
          <path key={index} d={d} />
        ))}
      </g>
    )
  }

  if (kind === 'hedge') {
    let d = `M0 ${(bend(0) + 5).toFixed(1)}`
    for (let x = 0; x < width; x += 26) {
      const next = Math.min(x + 26, width)
      const mid = (x + next) / 2
      d += ` Q${mid.toFixed(1)} ${(bend(mid) - 5).toFixed(1)} ${next.toFixed(1)} ${(
        bend(next) + 5
      ).toFixed(1)}`
    }
    return (
      <g className="iter-map__divider is-hedge">
        <path d={d} />
        <path d={polyline(9)} />
      </g>
    )
  }

  return null
}

function coastPath(height, seaW) {
  const points = []
  for (let y = 0; y < height; y += 26) {
    const x = seaW + 9 * Math.sin(y / 96) + 3.5 * Math.sin(y / 29 + 0.8)
    points.push([x, y])
  }
  points.push([
    seaW + 9 * Math.sin(height / 96) + 3.5 * Math.sin(height / 29 + 0.8),
    height,
  ])
  return points
    .map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join('')
}

function CompassRose({ x, y }) {
  return (
    <g className="iter-map__ground-compass" transform={`translate(${x} ${y})`}>
      <circle r="17" />
      <circle r="11" />
      <path d="M0 -22 L3.5 0 L0 22 L-3.5 0 Z" />
      <path d="M-22 0 L0 3.5 L22 0 L0 -3.5 Z" />
      <text x="0" y="-26" textAnchor="middle">N</text>
    </g>
  )
}

function ScaleBar({ x, y }) {
  return (
    <g className="iter-map__ground-scale" transform={`translate(${x} ${y})`}>
      <path d="M0 0 H96 M0 -4 V4 M48 -3 V3 M96 -4 V4" />
      <text x="0" y="-8">MILIA PASSVVM</text>
    </g>
  )
}

/* The end of the road: a triumphal gate, a laurel wreath, a sunburst and
   the word FINIS set larger than the waystation labels. */
function Finish({ x, y, side }) {
  const rays = []
  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2
    const inner = 17
    const outer = 28
    rays.push(
      `M${(x + Math.cos(angle) * inner).toFixed(1)} ${(y + Math.sin(angle) * inner).toFixed(
        1,
      )} L${(x + Math.cos(angle) * outer).toFixed(1)} ${(y + Math.sin(angle) * outer).toFixed(1)}`,
    )
  }

  return (
    <g className="iter-map__finish" aria-hidden="true">
      <g className="iter-map__finish-rays">
        {rays.map((d, index) => (
          <path key={index} d={d} />
        ))}
      </g>

      <path
        className="iter-map__finish-arch"
        d={`M${x - 20} ${y + 22} V${y - 2} A20 20 0 0 0 ${x + 20} ${y - 2} V${y + 22}`}
      />
      <path className="iter-map__finish-base" d={`M${x - 30} ${y + 22} H${x + 30}`} />

      <g className="iter-map__finish-laurel">
        <path d={`M${x - 7} ${y - 9} Q${x - 16} ${y} ${x - 7} ${y + 9}`} />
        <path d={`M${x + 7} ${y - 9} Q${x + 16} ${y} ${x + 7} ${y + 9}`} />
        <path d={`M${x - 11} ${y - 5} l-4 -2 M${x - 14} ${y - 1} l-4 0 M${x - 14} ${y + 3} l-4 0 M${x - 11} ${y + 7} l-4 2`} />
        <path d={`M${x + 11} ${y - 5} l4 -2 M${x + 14} ${y - 1} l4 0 M${x + 14} ${y + 3} l4 0 M${x + 11} ${y + 7} l4 2`} />
      </g>

      <path
        className="iter-map__finish-star"
        d={`M${x} ${y - 6} L${x + 6} ${y} L${x} ${y + 6} L${x - 6} ${y} Z`}
      />

      <text
        className="iter-map__finish-label"
        x={x + side * 34}
        y={y + 6}
        textAnchor={side < 0 ? 'end' : 'start'}
      >
        FINIS
      </text>
    </g>
  )
}

function Milestone({ x, y, numeral }) {
  return (
    <g className="iter-map__ground-milestone" transform={`translate(${x} ${y})`}>
      <rect x="-4.5" y="-8" width="9" height="16" rx="2" />
      <text x="0" y="2.4" textAnchor="middle">{numeral}</text>
    </g>
  )
}
