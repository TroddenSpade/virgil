import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  hasDefinition,
  norm,
  paradigmHref,
  wordHref,
} from '../lib/dictionary.js'
import {
  cachedLexicon,
  latinTokens,
  loadLexicon,
  lookupLexicon,
  parseReadingMarkup,
} from '../lib/lexicon.js'
import { formatParseList, principalParts } from '../lib/grammar.js'
import { readingWordKey } from '../lib/wordlist.js'

/**
 * The on/off state and the lazily loaded dictionary index shared by a
 * reading. Nothing is fetched until the reader asks for Lexicon mode.
 */
export function useLexiconMode() {
  const [enabled, setEnabled] = useState(false)
  const [index, setIndex] = useState(() => cachedLexicon())
  const [status, setStatus] = useState(() => (cachedLexicon() ? 'ready' : 'idle'))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || index) return undefined

    let live = true
    setStatus('loading')
    setError(null)

    loadLexicon()
      .then((next) => {
        if (!live) return
        setIndex(next)
        setStatus('ready')
      })
      .catch((err) => {
        if (!live) return
        setStatus('error')
        setError(err)
      })

    return () => {
      live = false
    }
  }, [enabled, index])

  const toggle = useCallback(() => {
    setEnabled((value) => !value)
  }, [])

  return { enabled, index, status, error, toggle }
}

/** The mode switch and its loading/error note. */
export function LexiconControls({ mode }) {
  const busy = mode.status === 'loading'

  return (
    <div className="lexicon-controls" role="group" aria-label="Reading options">
      {busy && (
        <span className="lexicon-controls__status" role="status">
          Loading lexicon…
        </span>
      )}
      {mode.status === 'error' && (
        <span
          className="lexicon-controls__status is-error"
          role="status"
          title={mode.error?.message || undefined}
        >
          Lexicon unavailable.
        </span>
      )}
      <button
        type="button"
        className="btn btn--ghost btn--sm lexicon-toggle"
        aria-pressed={mode.enabled}
        aria-busy={busy}
        title="Look up Latin words while reading"
        onClick={mode.toggle}
      >
        <span
          className={`lexicon-toggle__dot${mode.enabled ? ' is-on' : ''}`}
          aria-hidden="true"
        />
        Lexicon mode
      </button>
    </div>
  )
}

function positionFor(anchor, node) {
  const rect = anchor.getBoundingClientRect()
  const edge = 12
  const gap = 8
  const width = node.offsetWidth
  const height = node.offsetHeight

  let left = rect.left + rect.width / 2 - width / 2
  left = Math.max(edge, Math.min(left, window.innerWidth - edge - width))

  let top = rect.bottom + gap
  if (top + height > window.innerHeight - edge) {
    const above = rect.top - gap - height
    top = above >= edge ? above : Math.max(edge, window.innerHeight - edge - height)
  }

  return { left, top }
}

/**
 * Render reading text with every known Latin form as a button. The button
 * opens a small gloss popover with a route into the full lexicon entry.
 */
export const LexiconText = memo(function LexiconText({
  text,
  index,
  wordKeys,
  savedWords,
  source,
}) {
  const nodes = useMemo(() => parseReadingMarkup(text), [text])
  const [open, setOpen] = useState(null)
  const [position, setPosition] = useState(null)
  const popoverRef = useRef(null)
  const titleId = useId()

  const close = useCallback((restoreFocus = false) => {
    setOpen((current) => {
      if (restoreFocus) current?.anchor?.focus({ preventScroll: true })
      return null
    })
  }, [])

  const openWord = useCallback(
    (event, entry, token) => {
      const anchor = event.currentTarget
      if (open?.anchor === anchor) {
        close(true)
        return
      }
      setPosition(null)
      setOpen({ anchor, entry, token })
    },
    [close, open],
  )

  useLayoutEffect(() => {
    if (!open) return
    const node = popoverRef.current
    if (!node) return
    setPosition(positionFor(open.anchor, node))
  }, [open])

  useEffect(() => {
    if (!open || !position) return
    popoverRef.current?.focus({ preventScroll: true })
  }, [open, position])

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event) => {
      if (popoverRef.current?.contains(event.target)) return
      if (open.anchor?.contains(event.target)) return
      close(false)
    }
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      close(true)
    }
    const onFocusIn = (event) => {
      if (popoverRef.current?.contains(event.target)) return
      if (open.anchor?.contains(event.target)) return
      close(false)
    }
    const onScroll = () => {
      close(popoverRef.current?.contains(document.activeElement))
    }
    const onResize = () => close(false)

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocusIn)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [close, open])

  const entry = open?.entry || null
  const lemma = entry?.lemma || null
  const token = open?.token || entry?.form || ''
  const key = lemma ? readingWordKey(lemma.headword) : ''
  const known = Boolean(savedWords?.known?.[key])
  const saved = Boolean(savedWords?.saved?.[key])
  const inWordlist = saved || Boolean(wordKeys?.has(key))
  const isForm = Boolean(lemma) && norm(token) !== norm(lemma.headword)
  const parts = lemma ? principalParts(lemma.latin) : []
  const principal =
    parts.length > 1 && norm(parts[0]) === norm(lemma.headword)
      ? parts.slice(1).join(', ')
      : parts.join(', ')
  const parse = formatParseList(entry?.parse)
  const sense =
    lemma && hasDefinition(lemma.english)
      ? lemma.english
      : 'No definition is recorded for this word.'

  const content = nodes.map((node, nodeIndex) => {
    if (node.type === 'note') {
      return (
        <sup className="commentary__note-ref" key={`note${nodeIndex}`}>
          {node.value}
        </sup>
      )
    }

    const parts = latinTokens(node.value).map((part, partIndex) => {
      if (part.type === 'text') return part.value
      const found = lookupLexicon(index, part.value)
      if (!found) return part.value
      return (
        <button
          type="button"
          className="lex-word"
          key={`word${partIndex}`}
          aria-haspopup="dialog"
          title={`Look up ${part.value}`}
          onClick={(event) => openWord(event, found, part.value)}
        >
          {part.value}
        </button>
      )
    })

    let rendered = parts
    if (node.italic) rendered = <em>{rendered}</em>
    if (node.bold) rendered = <strong>{rendered}</strong>
    return <Fragment key={`text${nodeIndex}`}>{rendered}</Fragment>
  })

  return (
    <>
      {content}
      {open &&
        entry &&
        lemma &&
        createPortal(
          <div
            className="lex-popover"
            role="dialog"
            aria-modal="false"
            aria-labelledby={titleId}
            tabIndex={-1}
            ref={popoverRef}
            style={{
              left: position?.left ?? 0,
              top: position?.top ?? 0,
              visibility: position ? 'visible' : 'hidden',
            }}
          >
            <div className="lex-popover__head">
              <p className="lex-popover__word latin" id={titleId}>
                {token}
              </p>
              <button
                type="button"
                className="lex-popover__close"
                aria-label="Close gloss"
                onClick={() => close(true)}
              >
                ×
              </button>
            </div>

            {(parse || isForm) && (
              <p className="lex-popover__parse">
                {parse}
                {parse && isForm && ' of '}
                {isForm && <span className="latin">{lemma.headword}</span>}
              </p>
            )}

            <p
              className={`lex-popover__sense${
                hasDefinition(lemma.english) ? '' : ' is-empty'
              }`}
            >
              {sense}
            </p>

            {principal && (
              <p className="lex-popover__principal">
                <span className="lex-popover__principal-label">Principal parts</span>{' '}
                <span className="latin">{principal}</span>
              </p>
            )}

            <div className="lex-popover__study">
              {known ? (
                <button
                  type="button"
                  className="lex-popover__action is-on"
                  aria-pressed="true"
                  onClick={() => savedWords?.unknow(key)}
                >
                  ✓ Known · Undo
                </button>
              ) : (
                <>
                  {saved ? (
                    <button
                      type="button"
                      className="lex-popover__action is-on"
                      onClick={() => savedWords?.remove(key)}
                    >
                      ✓ In wordlist · Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="lex-popover__action"
                      disabled={inWordlist}
                      title={
                        inWordlist
                          ? 'Already in your wordlist from a learned chapter — use “I know this” to set it aside'
                          : undefined
                      }
                      onClick={() =>
                        savedWords?.save({
                          key,
                          headword: lemma.headword,
                          principal,
                          english: lemma.english,
                          posGroup: lemma.posGroup,
                          form: token,
                          source,
                        })
                      }
                    >
                      {inWordlist ? '✓ In wordlist' : '+ Save to wordlist'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="lex-popover__action lex-popover__action--quiet"
                    onClick={() => savedWords?.know(key)}
                  >
                    I know this
                  </button>
                </>
              )}
            </div>

            <div className="lex-popover__foot">
              <span className="lex-popover__pos">
                {lemma.posGroup && lemma.posGroup !== 'other' ? lemma.posGroup : 'lexicon'}
              </span>
              <span className="lex-popover__links">
                <Link
                  className="lex-popover__link"
                  to={paradigmHref(lemma.headword)}
                  onClick={() => close(false)}
                >
                  Paradigm
                </Link>
                <span aria-hidden="true">·</span>
                <Link
                  className="lex-popover__link"
                  to={wordHref(token)}
                  onClick={() => close(false)}
                >
                  Full entry →
                </Link>
              </span>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
})
