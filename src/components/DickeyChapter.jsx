import { Fragment, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { keywordsFor } from '../data/keywords.js'
import { useProgress } from '../hooks/useLocalStorage.js'
import { useScrollSpy } from '../hooks/useScrollSpy.js'
import { Inline } from './Commentary.jsx'
import KeywordChips from './KeywordChips.jsx'

/* ------------------------------------------------------------------ *
 * Learn Latin from the Romans — a faithful re-typesetting of the book.
 * The blocks produced by the source parser mirror the printed page:
 * numbered section heads, paradigm tables, the Practice blocks, the
 * lettered exercises in their own column counts, footnotes, the
 * Vocabulary grids, reading passages and the glossary.
 * ------------------------------------------------------------------ */

function splitHead(label) {
  const m = String(label || '').match(/^(\d+(?:\.\d+)*)\s*(.*)$/)
  return m ? { num: m[1], title: m[2] } : { num: '', title: label || '' }
}

/* A table header stores a span as an empty cell to the right of the
 * spanning label, e.g. ['Regō…', '', 'Dūcō…', ''] → two spans of 2. */
function headerCells(header) {
  const out = []
  let i = 0
  while (i < header.length) {
    if (header[i] === '') {
      out.push({ text: '', span: 1, blank: true })
      i += 1
      continue
    }
    let span = 1
    while (i + span < header.length && header[i + span] === '') span += 1
    out.push({ text: header[i], span })
    i += span
  }
  return out
}

function ParadigmTable({ block }) {
  const rows = block.rows || []
  if (!rows.length && !block.header) return null
  const width = Math.max(
    block.header?.length || 0,
    ...rows.map((r) => r.length),
  )
  const labelCol = Boolean(block.header) && (block.header[0] ?? '') === ''
  const head = block.header && block.header.some((c) => c) ? headerCells(block.header) : null
  return (
    <div className="dickey__table-wrap">
      <table className="dickey__table">
        {head && (
          <thead>
            <tr>
              {head.map((cell, i) => (
                <th key={i} colSpan={cell.span} className={cell.blank ? 'is-blank' : ''}>
                  {cell.text && <Inline text={cell.text} />}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td
                  key={c}
                  colSpan={row.length === 1 && width > 1 ? width : undefined}
                  className={
                    c === 0 && labelCol && cell ? 'dickey__cell dickey__cell--label' : 'dickey__cell'
                  }
                >
                  <Inline text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function colCount(items) {
  const withCols = items.find((it) => it.cols)
  return withCols ? Math.max(1, Math.min(4, withCols.cols)) : 1
}

function ExerciseItems({ items }) {
  const cols = colCount(items)
  if (cols <= 1) {
    return (
      <ol className="dickey__items dickey__items--one">
        {items.map((it, i) => (
          <li key={i} className="dickey__item">
            <span className="dickey__item-num">{it.n}</span>
            <span className="dickey__item-text"><Inline text={it.text} /></span>
          </li>
        ))}
      </ol>
    )
  }
  const rows = Math.ceil(items.length / cols)
  return (
    <ol
      className="dickey__items"
      style={{
        gridAutoFlow: 'column',
        gridTemplateRows: `repeat(${rows}, auto)`,
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
    >
      {items.map((it, i) => (
        <li key={i} className="dickey__item">
          <span className="dickey__item-num">{it.n}</span>
          <span className="dickey__item-text"><Inline text={it.text} /></span>
        </li>
      ))}
    </ol>
  )
}

function Passage({ block }) {
  if (block.speaker) {
    return (
      <p className="dickey__turn">
        <span className="dickey__speaker">{block.speaker}</span>
        <span className="dickey__turn-colon">:</span>{' '}
        <span className={block.lang === 'en' ? 'dickey__turn-en' : 'dickey__turn-la'}>
          <Inline text={block.text} />
        </span>
      </p>
    )
  }
  return (
    <p className={`dickey__passage latin${block.lang === 'en' ? ' is-en' : ''}`}>
      <Inline text={block.text} />
    </p>
  )
}

/* Group the flat block stream of a section into the book's own pieces. */
function renderBlocks(blocks) {
  const out = []
  const notes = []
  let items = null
  let passages = null
  let key = 0

  const flushItems = () => {
    if (items) {
      out.push(<ExerciseItems items={items} key={`i${key++}`} />)
      items = null
    }
  }
  const flushPassages = () => {
    if (passages) {
      out.push(
        <div className="dickey__passages" key={`p${key++}`}>
          {passages}
        </div>,
      )
      passages = null
    }
  }
  const flushAll = () => {
    flushItems()
    flushPassages()
  }

  for (const block of blocks) {
    if (block.t === 'li') {
      // a new `cols` on an item begins a new column group
      if (items && block.cols && block.cols !== colCount(items)) flushItems()
      if (!items) {
        flushPassages()
        items = []
      }
      items.push(block)
      continue
    }
    if (block.t === 'passage') {
      flushItems()
      if (!passages) passages = []
      passages.push(<Passage block={block} key={`ps${key++}`} />)
      continue
    }
    flushAll()
    switch (block.t) {
      case 'h': {
        const { num, title } = splitHead(block.text)
        out.push(
          <h3 className="dickey__head" key={`h${key++}`}>
            {num && <span className="dickey__head-num">{num}</span>}
            <span className="dickey__head-title"><Inline text={title} /></span>
          </h3>,
        )
        break
      }
      case 'p':
        out.push(
          <p className="dickey__p" key={`p${key++}`}>
            <Inline text={block.text} />
          </p>,
        )
        break
      case 'practice':
        out.push(
          <p className="dickey__practice" key={`pr${key++}`}>
            Practice
          </p>,
        )
        break
      case 'ex':
        out.push(
          <p className="dickey__ex" key={`e${key++}`}>
            <span className="dickey__ex-letter">{block.letter}</span>
            <span className="dickey__ex-text"><Inline text={block.text} /></span>
          </p>,
        )
        break
      case 'exlabel':
        out.push(
          <p className="dickey__exlabel" key={`el${key++}`}>
            <Inline text={block.text} />
          </p>,
        )
        break
      case 'table':
        out.push(<ParadigmTable block={block} key={`t${key++}`} />)
        break
      case 'vlabel': {
        const m = String(block.text || '').match(/^(Vocabulary\b)(.*)$/)
        out.push(
          <p className="dickey__vlabel" key={`vl${key++}`}>
            {m ? (
              <>
                <strong>{m[1]}</strong>
                <Inline text={m[2]} />
              </>
            ) : (
              <Inline text={block.text} />
            )}
          </p>,
        )
        break
      }      case 'vhead':
        out.push(
          <p className="dickey__vhead" key={`vh${key++}`}>
            <Inline text={block.text} />
          </p>,
        )
        break
      case 'term':
        out.push(
          <div className="dickey__term" key={`tm${key++}`}>
            <span className="dickey__term-word"><Inline text={block.term} /></span>
            <span className="dickey__term-def"><Inline text={block.text} /></span>
          </div>,
        )
        break
      case 'note':
        notes.push(block)
        break
      default:
        if (block.text) {
          out.push(
            <p className="dickey__p" key={`d${key++}`}>
              <Inline text={block.text} />
            </p>,
          )
        }
    }
  }
  flushAll()

  if (notes.length) {
    out.push(
      <div className="dickey__notes" key={`n${key++}`}>
        <span className="dickey__notes-rule" aria-hidden="true" />
        <ol className="dickey__notes-list">
          {notes.map((note, i) => (
            <li key={i} className="dickey__note">
              <span className="dickey__note-num">{note.n}</span>
              <span className="dickey__note-text"><Inline text={note.text} /></span>
            </li>
          ))}
        </ol>
      </div>,
    )
  }
  return out
}

export default function DickeyChapter({ book, chapter }) {
  const { isDone, toggle } = useProgress(book.id, book.chapterCount)
  const done = isDone(chapter.number)

  const ready = book.chapters.filter((c) => c.complete)
  const index = ready.findIndex((c) => c.number === chapter.number)
  const prev = index > 0 ? ready[index - 1] : null
  const next = index < ready.length - 1 ? ready[index + 1] : null

  const sections = useMemo(
    () =>
      (chapter.sections || []).map((section) => ({
        id: section.id,
        ...splitHead(section.latin || section.title || ''),
      })),
    [chapter],
  )
  const active = useScrollSpy(sections.map((s) => s.id))

  return (
    <article className="dickey">
      <div className="container dickey__container">
        <Link to={`/library/${book.slug}`} className="back-link">
          ← {book.shortTitle}
        </Link>

        <header className="dickey__opener">
          <span className="dickey__opener-num">{chapter.number}</span>
          <span className="dickey__opener-rule" aria-hidden="true" />
          <h1 className="dickey__opener-title">{chapter.title}</h1>
        </header>

        <KeywordChips ids={keywordsFor(book.slug, chapter.slug)} />

        <div className="dickey__layout">
          <aside className="lesson__rail">
            <div className="lesson__rail-inner">
              <p className="lesson__rail-title">In this chapter</p>
              <nav className="lesson__toc" aria-label="On this page">
                {sections.map((s) => (
                  <a key={s.id} href={`#${s.id}`} className={active === s.id ? 'is-active' : ''}>
                    <span className="lesson__toc-num">{s.num}</span>
                    <span className="lesson__toc-label">
                      <span className="lesson__toc-latin latin">{s.title}</span>
                    </span>
                  </a>
                ))}
              </nav>
              <button
                type="button"
                className={`btn btn--sm lesson__done ${done ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => toggle(chapter.number)}
                aria-pressed={done}
              >
                {done ? '✓ Marked as learned' : 'Mark as learned'}
              </button>
            </div>
          </aside>

          <div className="dickey__main">
            {chapter.sections?.length ? (
              chapter.sections.map((section) => {
                const { num, title } = splitHead(section.latin || section.title || '')
                return (
                  <section className="dickey__section" id={section.id} key={section.id}>
                    <h2 className="dickey__section-head">
                      {num && <span className="dickey__section-num">{num}</span>}
                      <span className="dickey__section-title"><Inline text={title} /></span>
                    </h2>
                    {renderBlocks(section.blocks || [])}
                  </section>
                )
              })
            ) : (
              <section className="dickey__section">{renderBlocks(chapter.blocks || [])}</section>
            )}
          </div>
        </div>

        <nav className="lesson__nav" aria-label="Chapter navigation">
          {prev ? (
            <Link className="lesson__nav-link lesson__nav-link--prev" to={`/library/${book.slug}/${prev.slug}`}>
              <span className="muted">← Chapter {prev.number}</span>
              <span className="latin">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link className="lesson__nav-link lesson__nav-link--next" to={`/library/${book.slug}/${next.slug}`}>
              <span className="muted">Chapter {next.number} →</span>
              <span className="latin">{next.title}</span>
            </Link>
          ) : (
            <Link className="lesson__nav-link lesson__nav-link--next" to={`/library/${book.slug}`}>
              <span className="muted">Back to →</span>
              <span>{book.shortTitle}</span>
            </Link>
          )}
        </nav>
      </div>
    </article>
  )
}
